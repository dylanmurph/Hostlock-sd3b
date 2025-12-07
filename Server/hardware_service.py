import os
import json
import queue
import boto3
from dotenv import load_dotenv
from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
from pubnub.callbacks import SubscribeCallback

# ------------------------------------------------------
# Configuration & Constants
# ------------------------------------------------------
load_dotenv()

PUBLISH_KEY = os.getenv("PUBNUB_PUBLISH_KEY")
SUBSCRIBE_KEY = os.getenv("PUBNUB_SUBSCRIBE_KEY")
CHANNEL = os.getenv("PUBNUB_CHANNEL")

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = os.getenv("AWS_REGION")
AWS_BUCKET = os.getenv("AWS_BUCKET")

BASE_DIR = os.path.dirname(__file__)
IMAGE_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(IMAGE_DIR, exist_ok=True)

# Shared Queue for SSE (Realtime stream)
message_queue = queue.Queue()

# Access Control Logic
ALLOWED_UIDS = {"A3A0264E", "2277264E"}
UID_LABELS = {
    "A3A0264E": "Fob 1",
    "2277264E": "Fob 2",
    "25CED870": "Fob 3",
    "83BC254E": "Fob 4",
    "1E09264E": "Fob 5",
    "7958264E": "Fob 6",
    "4A2C264E": "Fob 7",
    "10D0264E": "Fob 8",
    "B12E264E": "Fob 9",
    "9B0B274E": "Fob 10",
    "013D264E": "Fob 11",
}

# ------------------------------------------------------
# S3 Helper
# ------------------------------------------------------
try:
    s3 = boto3.client(
        "s3",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
    )
except Exception as e:
    print(f"Warning: AWS S3 could not initialize: {e}")
    s3 = None

def s3_download_and_delete(key: str) -> str:
    if not s3:
        return "error_no_s3_client.jpg"
        
    filename = os.path.basename(key)
    local_path = os.path.join(IMAGE_DIR, filename)

    try:
        s3.download_file(AWS_BUCKET, key, local_path)
        s3.delete_object(Bucket=AWS_BUCKET, Key=key)
        return filename
    except Exception as e:
        print(f"Error handling S3 file {key}: {e}")
        return "error_download_failed.jpg"

# ------------------------------------------------------
# PubNub Listener
# ------------------------------------------------------
class PiListener(SubscribeCallback):
    def message(self, pubnub, event):
        msg = event.message
        print(f"[HardwareService] Received: {msg}")

        # 1. Push raw message to SSE (for debugging/monitoring)
        message_queue.put(json.dumps(msg))

        # 2. Handle NFC Events (Access Control)
        if "nfc_uid" in msg:
            uid = msg["nfc_uid"]
            label = UID_LABELS.get(uid, "Unknown")
            access = "granted" if uid in ALLOWED_UIDS else "denied"

            # A. Send decision back to Pi immediately
            HardwareService.publish_decision(uid, access, label)

            # B. Push formatted event to SSE
            message_queue.put(json.dumps({
                "type": "access_decision",
                "nfc_uid": uid,
                "access": access,
                "label": label,
            }))

        # 3. Handle S3 Image Events
        if "s3_key" in msg:
            filename = s3_download_and_delete(msg["s3_key"])
            message_queue.put(json.dumps({
                "type": "new_image",
                "image_filename": filename,
            }))

# ------------------------------------------------------
# Service Class (Singleton)
# ------------------------------------------------------
class HardwareService:
    _pubnub_instance = None

    @staticmethod
    def start():
        """
        Initialize PubNub ONLY if it hasn't been initialized yet.
        """
        if HardwareService._pubnub_instance is not None:
            print("[HardwareService] PubNub already running (Singleton).")
            return

        if not all([PUBLISH_KEY, SUBSCRIBE_KEY, CHANNEL]):
            print("[HardwareService] Error: Missing PubNub credentials.")
            return

        pnconfig = PNConfiguration()
        pnconfig.publish_key = PUBLISH_KEY
        pnconfig.subscribe_key = SUBSCRIBE_KEY
        pnconfig.user_id = "web-server"
        pnconfig.enable_subscribe = True 

        pubnub = PubNub(pnconfig)
        pubnub.add_listener(PiListener())
        pubnub.subscribe().channels(CHANNEL).execute()

        HardwareService._pubnub_instance = pubnub
        print(f"[HardwareService] PubNub listener started on channel: {CHANNEL}")

    @staticmethod
    def publish_decision(uid: str, access: str, label: str):
        """
        Used by the Listener (or API routes) to send commands to the Pi.
        """
        if not HardwareService._pubnub_instance:
            print("[HardwareService] Error: Cannot publish, PubNub not started.")
            return

        message = {
            "access": access,
            "uid": uid,
            "label": label,
        }
        
        HardwareService._pubnub_instance.publish().channel(CHANNEL).message(message).sync()
        print(f"[HardwareService] Published decision: {message}")

    @staticmethod
    def publish_tamper_alert(tamper_id: str, msg: str):
        if not HardwareService._pubnub_instance: return
        
        payload = {"tamper_id": tamper_id, "alert": msg}
        HardwareService._pubnub_instance.publish().channel(CHANNEL).message(payload).sync()