import os
import time
import subprocess
import board
import busio
import boto3
import RPi.GPIO as GPIO
from gpiozero import OutputDevice
from adafruit_pn532.i2c import PN532_I2C

from dotenv import load_dotenv
load_dotenv()

from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
from pubnub.callbacks import SubscribeCallback

# ----------------------
# ENV VARIABLES
# ----------------------
PUBLISH_KEY = os.getenv("PUBNUB_PUBLISH_KEY")
SUBSCRIBE_KEY = os.getenv("PUBNUB_SUBSCRIBE_KEY")
CHANNEL = os.getenv("PUBNUB_CHANNEL")

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = os.getenv("AWS_REGION")
AWS_BUCKET = os.getenv("AWS_BUCKET")

# Flag to track if the alarm is currently active
tamper_alarm_active = False 

# ----------------------
# AWS S3 SETUP
# ----------------------
s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY
)

def upload_to_s3(filepath, filename):
    try:
        s3.upload_file(
            filepath,
            AWS_BUCKET,
            filename,
            ExtraArgs={}
        )
        print(f"Upload complete for {filename}.")

        # Delete local file after successful upload
        os.remove(filepath)
        return filename

    except Exception as e:
        print(f"Upload failed for {filepath}: {e}")
        return None

# ----------------------
# PubNub Setup
# ----------------------
pnconfig = PNConfiguration()
pnconfig.publish_key = PUBLISH_KEY
pnconfig.subscribe_key = SUBSCRIBE_KEY
pnconfig.user_id = "pi-nfc"
pnconfig.enable_subscribe = True

pubnub = PubNub(pnconfig)

# ----------------------
# GPIO Setup
# ----------------------
GPIO.setmode(GPIO.BCM)

LED_RED = 22
LED_YEL = 23
LED_GRN = 24
BUZZ = 18
RELAY = OutputDevice(17, active_high=False)
TAMP = 27

GPIO.setup(LED_RED, GPIO.OUT)
GPIO.setup(LED_YEL, GPIO.OUT)
GPIO.setup(LED_GRN, GPIO.OUT)
GPIO.setup(BUZZ, GPIO.OUT)

GPIO.setup(TAMP, GPIO.IN, pull_up_down=GPIO.PUD_UP)

GPIO.output(LED_RED, True)  #Default state: Red ON
RELAY.on() #Door locked 

# ----------------------
# PN532 NFC Reader
# ----------------------
i2c = busio.I2C(board.SCL, board.SDA)
pn532 = PN532_I2C(i2c, debug=False)
pn532.SAM_configuration()

# ----------------------
# Camera
# ----------------------
CAPTURE_DIR = "/home/pi/captures"
os.makedirs(CAPTURE_DIR, exist_ok=True)

RPICAM = "/usr/bin/rpicam-still"

def take_photo(id_tag):
    filename = f"{id_tag}_{time.strftime('%Y%m%d_%H%M%S')}.jpg"
    path = os.path.join(CAPTURE_DIR, filename)

    subprocess.run([
        RPICAM,
        "-o", path,
        "-t", "1000",
        "--nopreview",
        "--width", "1920",
        "--height", "1080"
    ], check=True)

    return path, filename

# ----------------------
# Tamper Switch & Logic
# ----------------------
def tampered_with():
    return GPIO.input(TAMP) == GPIO.HIGH

def reset_tamper_alarm():
    print("Tamper alarm reset")
    
    GPIO.output(LED_RED, True)
    GPIO.output(LED_YEL, False)
    GPIO.output(LED_GRN, False)
    GPIO.output(BUZZ, False)
    
    RELAY.on()


def handle_tamper():
    global tamper_alarm_active
    
    print("TAMPER DETECTED! Initiating alarm and capture.")
    tamper_alarm_active = True #global state
    
    RELAY.on()
    GPIO.output(LED_GRN, False)
    for _ in range(10):
        GPIO.output(LED_RED, True)
        GPIO.output(LED_YEL, False)
        GPIO.output(BUZZ, True)
        time.sleep(0.1)
        GPIO.output(LED_RED, False)
        GPIO.output(LED_YEL, True)
        GPIO.output(BUZZ, False)
        time.sleep(0.1)
        
    GPIO.output(LED_RED, True)
    GPIO.output(LED_YEL, False)
    GPIO.output(LED_GRN, False)
    GPIO.output(BUZZ, False)
    
    img_path, img_name = take_photo("TAMPER")

    s3_key = upload_to_s3(img_path, img_name)

    try:
        pubnub.publish().channel(CHANNEL).message({
            "event": "tamper",
            "timestamp": time.time(),
            "s3_key": s3_key 
        }).sync()
    except Exception as e:
        print(f"Failed to send tamper alert: {e}")
        
        
# ----------------------
# Access Control LEDs/Buzzer
# ----------------------

def grant_access():
    
    GPIO.output(LED_RED, False)
    GPIO.output(LED_YEL, False)
    GPIO.output(LED_GRN, True)
    RELAY.off() #Unlock door
    time.sleep(5)
    GPIO.output(LED_GRN, False)
    GPIO.output(LED_RED, True)
    RELAY.on() #Lock door
    
def grant_access_no_face():
    
    GPIO.output(LED_RED, False)
    GPIO.output(LED_GRN, True)
    RELAY.off()
    for _ in range(3):
        GPIO.output(LED_YEL, True); time.sleep(0.3)
        GPIO.output(LED_YEL, False); time.sleep(0.3)
    time.sleep(2)
    GPIO.output(LED_GRN, False)
    GPIO.output(LED_RED, True)
    RELAY.on()

def deny_access():

    GPIO.output(LED_YEL, False)
    for _ in range(3):
        GPIO.output(LED_RED, True); time.sleep(0.3)
        GPIO.output(LED_RED, False); time.sleep(0.3)
    
    GPIO.output(LED_GRN, False)
    GPIO.output(LED_RED, True)
    GPIO.output(BUZZ, True)
    time.sleep(1)
    GPIO.output(BUZZ, False)

# ----------------------
# Listener Access Decisions
# ----------------------
class MyListener(SubscribeCallback):
    """Listens for server messages, primarily access decisions."""
    def message(self, pubnub, message):
        msg = message.message
        #Handle Access Decisions
        if "access" in msg:
            print(f"Server decision received: {msg['access']}")
            if msg["access"] == "granted":
                grant_access()
            elif msg["access"] == "granted_no_face":
                grant_access_no_face()
            else:
                deny_access()

pubnub.add_listener(MyListener())
pubnub.subscribe().channels(CHANNEL).execute()

# ----------------------
# MAIN LOOP
# ----------------------
print("System ready. Waiting for NFC tag...")
try:
    while True:
        
        #ALARM TRIGGER
        if tampered_with() and not tamper_alarm_active:
            handle_tamper()
            
        #ALARM RESET
        if tamper_alarm_active and not tampered_with():
            reset_tamper_alarm()
            tamper_alarm_active = False #Reset the state
            
        #SKIP NFC: If the alarm is active, monitor the switch and skip all other logic.
        if tamper_alarm_active:
            time.sleep(0.5)
            continue
    
        #NFC, only runs when alarm is inactive
        uid = pn532.read_passive_target(timeout=0.5)

        if uid:
            uid_hex = uid.hex().upper()
            print(f"Tag detected: {uid_hex}")
            GPIO.output(LED_RED, False)
            GPIO.output(LED_YEL, True)
            
            # Flash yellow + beep
            GPIO.output(BUZZ, True)
            time.sleep(1)
            GPIO.output(BUZZ, False)

            # Take photo
            img_path, img_name = take_photo(uid_hex)
            # Upload to AWS
            s3_key = upload_to_s3(img_path, img_name)

            # Send NFC + s3key to server
            pubnub.publish().channel(CHANNEL).message({
                "nfc_uid": uid_hex,
                "s3_key": s3_key
            }).sync()

        time.sleep(0.1)

except KeyboardInterrupt:
    GPIO.cleanup()
    print("Exiting cleanly...")
