import os
os.environ["GPIOZERO_PIN_FACTORY"] = "rpigpio"
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
    """Upload to S3 (private). Returns the key only."""
    print(f" Uploading {filename} to S3...")

    try:
        s3.upload_file(
            filepath,
            AWS_BUCKET,
            filename,
            ExtraArgs={}   # ← PRIVATE upload (no ACL)
        )
        print(" Upload complete.")

        #  Delete local file after successful upload
        try:
            os.remove(filepath)
            print(f" Deleted local file: {filepath}")
        except OSError as e:
            print(f" Could not delete {filepath}: {e}")

        return filename   # return filename as s3_key

    except Exception as e:
        print(f" Upload failed for {filepath}: {e}")
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
# Listener (access decisions)
# ----------------------
class MyListener(SubscribeCallback):
    def message(self, pubnub, message):
        msg = message.message
        print("Server says:", msg)

        if "access" in msg:
            if msg["access"] == "granted":
                grant_access()
            elif msg["access"] == "granted_no_face":
                grant_access_no_face()
            else:
                deny_access()

pubnub.add_listener(MyListener())
pubnub.subscribe().channels(CHANNEL).execute()


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

GPIO.output(LED_RED, True)  # Default = red ON
RELAY.on()


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

def take_photo(uid_hex):
    filename = f"{uid_hex}_{time.strftime('%Y%m%d_%H%M%S')}.jpg"
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
# Tamper Switch
# ----------------------

def tampered_with():
    return GPIO.input(TAMP) == GPIO.HIGH

def handle_tamper():
    print("!!! TAMPER DETECTED !!!")
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
    
    try:
        pubnub.publish().channel(CHANNEL).message({
            "event": "tamper",
            "timestamp": time.time()
        }).sync()
        print("Tamper alert sent to server.")
    except Exception as e:
        print("Failed to send tamper alert:", e)
    
    
# ----------------------
# Access Control LEDs/Buzzer
# ----------------------


def grant_access():
    GPIO.output(LED_RED, False)
    GPIO.output(LED_YEL, False)
    GPIO.output(LED_GRN, True)
    RELAY.off()
    time.sleep(5)
    GPIO.output(LED_GRN, False)
    GPIO.output(LED_RED, True)
    RELAY.on()
    
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
# MAIN LOOP
# ----------------------
print("Waiting for NFC tag...")
tampered_already = False
try:
    while True:
        
        # Check tamper switch
        if not tampered_already:
            if tampered_with():
                handle_tamper()
                tampered_already = True
                
        if not tampered_with():
            tampered_already = False
        else:
            time.sleep(1)
            continue
    
        uid = pn532.read_passive_target(timeout=0.5)

        if uid:
            uid_hex = uid.hex().upper()
            print("Tag detected:", uid_hex)
            GPIO.output(LED_RED, False)
            GPIO.output(LED_YEL, True)
            
            # Flash yellow + beep
            GPIO.output(BUZZ, True)
            time.sleep(1)
            GPIO.output(BUZZ, False)

            # Take photo
            img_path, img_name = take_photo(uid_hex)

            # Upload to AWS (PRIVATE)
            s3_key = upload_to_s3(img_path, img_name)

            # Send NFC + s3_key to server
            pubnub.publish().channel(CHANNEL).message({
                "nfc_uid": uid_hex,
                "s3_key": s3_key
            }).sync()

        time.sleep(0.1)

except KeyboardInterrupt:
    GPIO.cleanup()
    print("Exiting cleanly...")
