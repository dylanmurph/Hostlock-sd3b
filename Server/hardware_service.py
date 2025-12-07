import os
import json
import queue
import boto3
from dotenv import load_dotenv
from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
from pubnub.callbacks import SubscribeCallback
from datetime import datetime, timezone
# Removed import: from sqlalchemy.exc import OperationalError 
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
TAMPER_IMAGE_DIR = os.path.join(IMAGE_DIR, "tampers") # Dedicated directory for tamper images

os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(TAMPER_IMAGE_DIR, exist_ok=True) # Ensure tamper directory exists

# Shared Queue for Server-Sent Events (Realtime stream to frontend)
message_queue = queue.Queue()

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
    s3 = None
    print(f"[HardwareService] ERROR: AWS S3 could not initialize: {e}")

def s3_download_and_delete(key: str, event_type: str = "fob") -> str:
    """
    Downloads an image from S3, deletes it from the bucket, and returns 
    the local relative path for database storage.

    The event_type determines the local subdirectory and the returned path.
    """
    if not s3:
        return "error_no_s3_client.jpg"
        
    filename = os.path.basename(key)
    
    # Select path based on event type
    if event_type == "tamper":
        local_dir = TAMPER_IMAGE_DIR
        relative_prefix = "/uploads/tampers/"
    else: # Default for fob_tap
        local_dir = IMAGE_DIR
        relative_prefix = "/uploads/"
        
    local_path = os.path.join(local_dir, filename)

    try:
        s3.download_file(AWS_BUCKET, key, local_path)
        s3.delete_object(Bucket=AWS_BUCKET, Key=key)
        
        # Return the path accessible by the frontend
        return f"{relative_prefix}{filename}"
    except Exception as e:
        print(f"[HardwareService] ERROR handling S3 file {key}: {e}")
        return "error_download_failed.jpg"


# ------------------------------------------------------
# PubNub Listener
# ------------------------------------------------------
class PiListener(SubscribeCallback):
    """Handles incoming messages from the Raspberry Pi over PubNub."""
    def message(self, pubnub, event):
        msg = event.message
        print(f"[HardwareService] Received: {msg}")

        # 1. Ignore messages sent by the server itself (to prevent logging/PubNub loops)
        if msg.get("source") == "server_decision" or msg.get("source") == "server_tamper_ack":
             print(f"[HardwareService] IGNORING server broadcast ({msg.get('source')}).")
             return

        # 2. Push raw message to SSE (for debugging/monitoring)
        message_queue.put(json.dumps(msg))

        # 3. Handle NFC Events (Access Control and Logging)
        if "nfc_uid" in msg:
            uid = msg["nfc_uid"]
            s3_key = msg.get("s3_key")
            
            app_instance = HardwareService._app_instance
            if not app_instance:
                print("[HardwareService] ERROR: App instance not available for logging.")
                HardwareService.publish_decision(uid, "denied", "Service Error")
                return

            with app_instance.app_context():
                # Lazy imports within the context
                from . import db
                from .models import Fob, AccessLog
                
                # Check access rights against database bookings
                access_granted, label, booking_id = HardwareService._check_active_booking(uid)
                access = "granted" if access_granted else "denied"
                
                # Download image from S3 and get the local path
                snapshot_path = "N/A"
                if s3_key:
                    snapshot_path = s3_download_and_delete(s3_key, event_type="fob")

                # Create and commit Access Log entry
                fob_record = Fob.query.filter_by(uid=uid).first()
                new_log = AccessLog(
                    bnb_id=1,
                    raw_uid=uid,
                    fob_id=fob_record.id if fob_record else None,
                    booking_id=booking_id,
                    match_result=access,
                    face_confidence=0.0,
                    snapshot_path=snapshot_path,
                    event_type="fob_tap"
                )
                db.session.add(new_log)
                db.session.commit() # The known bug will still happen here if the schema is stale
                print(f"[HardwareService] LOGGED: Access {access} for UID {uid}")
            
            # Send access decision back to Pi
            HardwareService.publish_decision(uid, access, label)

            # Push formatted event to SSE
            message_queue.put(json.dumps({
                "type": "access_decision", "nfc_uid": uid, "access": access, "label": label,
                "booking_id": booking_id, "snapshot": snapshot_path
            }))

        # 4. Handle Tamper Alerts (Logging to DB with Image)
        if msg.get("event") == "tamper":
            tamper_id = "Hardware_Tamper_Alert_1"
            bnb_id = 1
            s3_key = msg.get("s3_key") # Get the S3 key from the Pi
            
            app_instance = HardwareService._app_instance
            if not app_instance:
                print("[HardwareService] ERROR: App instance not available for logging tamper event.")
                HardwareService.publish_tamper_alert(tamper_id, "Service Error: Failed to log.")
                return

            with app_instance.app_context():
                from . import db
                from .models import TamperAlert
                
                # Download image from S3 and get the local path (uses "tamper" type)
                snapshot_path = "N/A"
                if s3_key:
                    snapshot_path = s3_download_and_delete(s3_key, event_type="tamper")
                
                # Create and log the tamper event
                new_tamper = TamperAlert(
                    bnb_id=bnb_id,
                    tamper_id=tamper_id,
                    snapshot_path=snapshot_path # Save the image path
                )
                db.session.add(new_tamper)
                
                try:
                    db.session.commit()
                    print(f"[HardwareService] LOGGED: Tamper Alert ID: {tamper_id} with image {snapshot_path}")
                except Exception as e:
                    db.session.rollback()
                    print(f"[HardwareService] DB ERROR logging tamper alert {tamper_id}: {e}")
            
            # Publish simple alert (used by the Pi to acknowledge the server logged the event)
            HardwareService.publish_tamper_alert(tamper_id, "Tamper detected!")

            # Push formatted event to SSE
            message_queue.put(json.dumps({
                "type": "tamper_alert", "tamper_id": tamper_id, "bnb_id": bnb_id, "snapshot": snapshot_path
            }))
            

        # 5. Handle S3 Image Events (Fallback for image-only messages)
        if "s3_key" in msg and "nfc_uid" not in msg and "event" not in msg:
             filename = s3_download_and_delete(msg["s3_key"])
             message_queue.put(json.dumps({"type": "new_image", "image_filename": filename}))


# ------------------------------------------------------
# Service Class (Singleton)
# ------------------------------------------------------
class HardwareService:
    """Manages the PubNub connection and provides static methods for hardware interaction."""
    _pubnub_instance = None
    _app_instance = None 

    @staticmethod
    def _get_utc_now():
        """Returns the current time in UTC with timezone info."""
        return datetime.now(timezone.utc)

    @staticmethod
    def _check_active_booking(uid: str) -> tuple[bool, str, int | None]:
        """
        Checks the FobBooking table for an active booking linked to the UID.
        This method must be called within an application context.
        Returns: (access_granted, label, booking_id)
        """
        if not HardwareService._app_instance:
             print("[HardwareService] ERROR: App instance not set for DB access.")
             return (False, "Service Error", None)
             
        now = HardwareService._get_utc_now()
        
        with HardwareService._app_instance.app_context():
             from . import db
             from .models import Fob, FobBooking
            
             active_fob_booking = (
                 db.session.query(FobBooking)
                 .join(Fob) 
                 .filter(Fob.uid == uid, FobBooking.is_active == True, FobBooking.active_from <= now, FobBooking.active_until >= now)
                 .first()
             )
            
             if active_fob_booking:
                 fob = db.session.get(Fob, active_fob_booking.fob_id)
                 label = fob.label if fob and fob.label else f"Fob ID: {fob.id}"
                 return (True, label, active_fob_booking.booking_id)
            
             fob_record = Fob.query.filter_by(uid=uid).first()
             label = fob_record.label if fob_record and fob_record.label else "Unknown UID"
        
             return (False, label, None)


    @staticmethod
    def start(app_instance): 
        """
        Initializes the PubNub connection and starts the listener thread.
        """
        if HardwareService._pubnub_instance is not None:
            print("[HardwareService] PubNub already running (Singleton).")
            return
        
        HardwareService._app_instance = app_instance 

        if not all([PUBLISH_KEY, SUBSCRIBE_KEY, CHANNEL]):
            print("[HardwareService] ERROR: Missing PubNub credentials.")
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
        Sends an access control decision (granted/denied) back to the Pi.
        """
        if not HardwareService._pubnub_instance:
            return

        message = {
            "access": access,
            "uid": uid,
            "label": label,
            "source": "server_decision" 
        }
        
        HardwareService._pubnub_instance.publish().channel(CHANNEL).message(message).sync()

    @staticmethod
    def publish_tamper_alert(tamper_id: str, msg: str):
        """
        Sends an acknowledgement/alert about a tamper event back to the Pi.
        """
        if not HardwareService._pubnub_instance: return
        
        payload = {
            "tamper_id": tamper_id, 
            "alert": msg,
            "source": "server_tamper_ack" 
        }
        HardwareService._pubnub_instance.publish().channel(CHANNEL).message(payload).sync()
