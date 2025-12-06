from flask import Blueprint, request, jsonify
from .models import db, AccessLog, TamperAlert
# Import from the new service file
from .hardware_service import HardwareService, message_queue, UID_LABELS, ALLOWED_UIDS

hardware_bp = Blueprint('hardware', __name__)

@hardware_bp.route("/hardware/fob_tap", methods=["POST"])
def handle_fob_tap_event():
    """
    Handle fob tap events via HTTP POST (if used) or manual testing.
    """
    data = request.get_json()
    nfc_uid = data.get("nfc_uid")

    if not nfc_uid:
        return jsonify({"error": "Missing NFC UID"}), 400

    # Check access
    if nfc_uid in ALLOWED_UIDS:
        access = "granted"
    else:
        access = "denied"
    
    label = UID_LABELS.get(nfc_uid, "Unknown")

    # Log to Database
    # Note: Ensure your AccessLog model supports these fields
    # new_log = AccessLog(uid=nfc_uid, access=access)
    # db.session.add(new_log)
    # db.session.commit()

    # Use the Service to publish to Pi
    HardwareService.publish_decision(nfc_uid, access, label)

    # Push to SSE
    message_queue.put({
        "type": "access_decision",
        "nfc_uid": nfc_uid,
        "access": access,
        "label": label
    })

    return jsonify({"message": "Access decision published", "access": access})


@hardware_bp.route("/hardware/tamper_event", methods=["POST"])
def handle_tamper_event():
    """
    Handle tamper events via HTTP POST.
    """
    data = request.get_json()
    tamper_id = data.get("tamper_id")

    if not tamper_id:
        return jsonify({"error": "Missing tamper ID"}), 400

    # Log to Database
    # new_tamper = TamperAlert(bnb_id=1) # Example
    # db.session.add(new_tamper)
    # db.session.commit()

    # Publish alert
    HardwareService.publish_tamper_alert(tamper_id, "Tamper detected!")

    return jsonify({"message": "Tamper alert published"})