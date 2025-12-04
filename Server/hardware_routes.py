# Server/hardware_routes.py

from flask import Blueprint, request, jsonify
from .hardware import publish_access_decision, message_queue, init_pubnub, UID_LABELS, ALLOWED_UIDS, CHANNEL
from .models import db, AccessLog, TamperLog 

hardware_bp = Blueprint('hardware', __name__)

# Initialize PubNub for usage in this file
pubnub = init_pubnub()

@hardware_bp.route("/hardware/fob_tap", methods=["POST"])
def handle_fob_tap_event():
    """
    Handle fob tap events: check if the UID is allowed, log access, and publish decision.
    """
    data = request.get_json()
    nfc_uid = data.get("nfc_uid")  # expected to be part of the POST body

    if not nfc_uid:
        return jsonify({"error": "Missing NFC UID"}), 400

    # Check access
    if nfc_uid in ALLOWED_UIDS:
        access = "granted"
    else:
        access = "denied"

    # Log the access event (if you have an AccessLog model)
    new_log = AccessLog(uid=nfc_uid, access=access)
    db.session.add(new_log)
    db.session.commit()

    # Publish decision to PubNub
    publish_access_decision(pubnub, nfc_uid, access)

    # Push the decision to the message queue for SSE
    message_queue.put({
        "nfc_uid": nfc_uid,
        "access": access,
        "label": UID_LABELS.get(nfc_uid, "Unknown")
    })

    return jsonify({"message": "Access decision published", "access": access})


@hardware_bp.route("/hardware/tamper_event", methods=["POST"])
def handle_tamper_event():
    """
    Handle tamper events: log the event and send an alert via PubNub.
    """
    data = request.get_json()
    tamper_id = data.get("tamper_id")

    if not tamper_id:
        return jsonify({"error": "Missing tamper ID"}), 400

    # Log the tamper event (if you have a TamperLog model)
    new_tamper = TamperLog(tamper_id=tamper_id)
    db.session.add(new_tamper)
    db.session.commit()

    # Publish tamper alert to PubNub
    alert_message = {"tamper_id": tamper_id, "alert": "Tamper detected!"}
    pubnub.publish().channel(CHANNEL).message(alert_message).sync()

    # Push tamper alert to the message queue for SSE
    message_queue.put({
        "tamper_id": tamper_id,
        "alert": "Tamper detected!"
    })

    return jsonify({"message": "Tamper alert published"})
