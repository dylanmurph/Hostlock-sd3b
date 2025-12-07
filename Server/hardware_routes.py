import json 
from flask import Blueprint, request, jsonify
# Import from your database models
from .models import db, AccessLog, TamperAlert, Fob, Booking, BnB
# Import service components
from .hardware_service import HardwareService, message_queue, s3_download_and_delete 

hardware_bp = Blueprint('hardware', __name__)

@hardware_bp.route("/hardware/fob_tap", methods=["POST"])
def handle_fob_tap_event():
    """
    Handles fob tap events via HTTP POST (e.g., for manual testing).
    The PubNub listener handles the primary logging from the Pi.
    """
    data = request.get_json()
    nfc_uid = data.get("nfc_uid")
    bnb_id = 1 

    if not nfc_uid:
        return jsonify({"error": "Missing NFC UID"}), 400

    # Check access against the database
    access_granted, label, booking_id = HardwareService._check_active_booking(nfc_uid)
    access = "granted" if access_granted else "denied"
    
    # Publish decision back to Pi
    HardwareService.publish_decision(nfc_uid, access, label)

    # Push event to SSE for front-end real-time update
    message_queue.put(json.dumps({ 
        "type": "access_decision_route",
        "nfc_uid": nfc_uid,
        "access": access,
        "label": label,
        "booking_id": booking_id
    }))

    return jsonify({"message": "Access decision published", "access": access}), 200


@hardware_bp.route("/hardware/tamper_event", methods=["POST"])
def handle_tamper_event():
    """
    Handles tamper events via HTTP POST.
    Logs the tamper event and optionally downloads an image if an s3_key is provided.
    """
    data = request.get_json()
    tamper_id = data.get("tamper_id")
    s3_key = data.get("s3_key") # Optional S3 Key for manual testing
    bnb_id = 1 

    if not tamper_id:
        return jsonify({"error": "Missing tamper ID"}), 400

    # Handle image download and get the local path
    snapshot_path = "N/A"
    if s3_key:
        snapshot_path = s3_download_and_delete(s3_key, event_type="tamper")
    
    # Log the tamper event to the database
    new_tamper = TamperAlert(
        bnb_id=bnb_id, 
        tamper_id=tamper_id,
        snapshot_path=snapshot_path
    ) 
    db.session.add(new_tamper)
    db.session.commit()

    # Publish alert
    HardwareService.publish_tamper_alert(tamper_id, "Tamper detected!")

    return jsonify({"message": "Tamper alert published", "snapshot": snapshot_path}), 200