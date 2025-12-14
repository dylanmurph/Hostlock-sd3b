import os
import signal
import subprocess
import time
import json
from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
from pubnub.callbacks import SubscribeCallback
from pubnub.crypto import AesCbcCryptoModule
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

PUBLISH_KEY = os.getenv("PUBNUB_PUBLISH_KEY")
SUBSCRIBE_KEY = os.getenv("PUBNUB_SUBSCRIBE_KEY")
CHANNEL = os.getenv("PUBNUB_CHANNEL")
CIPHER_KEY = os.getenv("PUBNUB_CIPHER_KEY")

HEARTBEAT_DIR = "/home/ubuntu/hostlock-sd3b/heartbeats"

os.makedirs(HEARTBEAT_DIR, exist_ok=True)

log_filename = f"pi_heartbeat_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.log"
STATUS_LOG_FILE = os.path.join(HEARTBEAT_DIR, log_filename)

pnconfig = PNConfiguration()
pnconfig.publish_key = PUBLISH_KEY
pnconfig.subscribe_key = SUBSCRIBE_KEY
pnconfig.user_id = "server-heartbeat"
pnconfig.enable_subscribe = True
pnconfig.cipher_key = CIPHER_KEY
pnconfig.crypto_module = AesCbcCryptoModule(pnconfig)

pubnub = PubNub(pnconfig)

response_received = False

class HeartbeatListener(SubscribeCallback):
    def message(self, pubnub, message):
        global response_received
        msg = message.message
        print(f"Received message: {msg}")

        if msg.get("type") == "heartbeat_response":
            print("Received heartbeat response from Pi.")
            log_status(msg)
            response_received = True

def log_status(msg):
    """Log the Pi's heartbeat response to the file."""
    status = msg.get("message", "No message")
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"{timestamp} - Pi Status: {status}\n"

    print(log_message)

    with open(STATUS_LOG_FILE, "a") as log_file:
        log_file.write(log_message)

def send_heartbeat_request():
    """Send heartbeat request to the Pi."""
    message = {
        "type": "heartbeat_request",
        "timestamp": time.time()
    }
    try:
        pubnub.publish().channel(CHANNEL).message(message).sync()
        print(f"Heartbeat request sent at {time.time()}")
    except Exception as e:
        print(f"Error sending heartbeat request: {e}")

heartbeat_listener = HeartbeatListener()
pubnub.add_listener(heartbeat_listener)

pubnub.subscribe().channels(CHANNEL).execute()

send_heartbeat_request()

start_time = time.time()
while not response_received and time.time() - start_time < 30:
    time.sleep(0.5)

if not response_received:
    log_status({"type": "heartbeat_response", "message": "No response from Pi within 30 seconds."})

os.kill(os.getpid(), signal.SIGTSTP)
print("Exiting...")