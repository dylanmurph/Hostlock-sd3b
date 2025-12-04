import os
import json
import queue
from dotenv import load_dotenv
import boto3

from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
from pubnub.callbacks import SubscribeCallback

# ------------------------------------------------------
# Load env + constants (basically copied from app.py)
# ------------------------------------------------------
load_dotenv()

PUBLISH_KEY = os.getenv("PUBNUB_PUBLISH_KEY")
SUBSCRIBE_KEY = os.getenv("PUBNUB_SUBSCRIBE_KEY")
CHANNEL = os.getenv("PUBNUB_CHANNEL")

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = os.getenv("AWS_REGION")
AWS_BUCKET = os.getenv("AWS_BUCKET")

if not all([PUBLISH_KEY, SUBSCRIBE_KEY, CHANNEL]):
    raise RuntimeError("Missing PubNub credentials in .env")

if not all([AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION, AWS_BUCKET]):
    raise RuntimeError("Missing AWS credentials in .env")

# ------------------------------------------------------
# Image dir + message queue (shared by routes)
# ------------------------------------------------------
BASE_DIR = os.path.dirname(__file__)
IMAGE_DIR = os.path.join(BASE_DIR, "uploads")  # or "static/uploads" – match your old setup
os.makedirs(IMAGE_DIR, exist_ok=True)

message_queue: "queue.Queue[str]" = queue.Queue()

ALLOWED_UIDS = {"A3A0264E", "2277264E"}  # copy from app.py
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
# S3 client + helper
# ------------------------------------------------------
s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
)

def s3_download_and_delete(key: str) -> str:
    filename = os.path.basename(key)
    local_path = os.path.join(IMAGE_DIR, filename)

    s3.download_file(AWS_BUCKET, key, local_path)
    s3.delete_object(Bucket=AWS_BUCKET, Key=key)

    return filename

# ------------------------------------------------------
# PubNub listener
# ------------------------------------------------------
class WebListener(SubscribeCallback):
    def message(self, pubnub, event):
        msg = event.message
        print("Received PubNub message:", msg)

        # push raw message to SSE clients
        message_queue.put(json.dumps(msg))

        # NFC events
        if "nfc_uid" in msg:
            uid = msg["nfc_uid"]
            label = UID_LABELS.get(uid, "Unknown")
            access = "granted" if uid in ALLOWED_UIDS else "denied"

            # send decision back to hardware
            pubnub.publish().channel(CHANNEL).message({
                "access": access,
                "uid": uid,
                "label": label,
            }).sync()

            # also push a “nice” object into SSE stream
            message_queue.put(json.dumps({
                "nfc_uid": uid,
                "access": access,
                "label": label,
            }))

        # S3 image events
        if "s3_key" in msg:
            filename = s3_download_and_delete(msg["s3_key"])
            message_queue.put(json.dumps({
                "image_filename": filename,
            }))

def init_pubnub() -> PubNub:
    """
    Set up PubNub and start subscribing.
    Call this once from create_app().
    """
    pnconfig = PNConfiguration()
    pnconfig.publish_key = PUBLISH_KEY
    pnconfig.subscribe_key = SUBSCRIBE_KEY
    pnconfig.user_id = "web-server"
    pnconfig.enable_subscribe = True

    pubnub = PubNub(pnconfig)
    pubnub.add_listener(WebListener())
    pubnub.subscribe().channels(CHANNEL).execute()

    print("PubNub initialized and subscribed on channel:", CHANNEL)
    return pubnub

def publish_access_decision(pubnub, uid: str, access: str) -> None:
    """
    Function to publish an access decision to the PubNub channel.
    """
    label = UID_LABELS.get(uid, "Unknown")
    message = {
        "access": access,
        "uid": uid,
        "label": label,
    }

    # Publish access decision back to hardware
    pubnub.publish().channel(CHANNEL).message(message).sync()
    print(f"Published access decision: {message}")
