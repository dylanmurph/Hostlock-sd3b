from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, AccessLog, BnB, Booking, UserBooking, User

access_bp = Blueprint("access", __name__)

# ====================================================================
# HELPER FUNCTIONS
# ====================================================================

def get_names_from_booking(booking_id):
    if not booking_id:
        return None

    linked_users = (
        db.session.query(User.name)
        .join(UserBooking, User.id == UserBooking.user_id)
        .filter(UserBooking.booking_id == booking_id)
        .distinct()
        .all()
    )

    if linked_users:
        return linked_users[0][0]
    return None

# Helper to adjust snapshot path returned to client
def _get_adjusted_snapshot_path(path):

    if path and path.startswith('/uploads/'):
        return path.replace('/uploads/', '/uploads/access_logs/')
    return path


def _serialise_log(log):
    """Ensure all access-log endpoints return the same shape, prioritizing booking guest name."""
    raw_status = (log.match_result or "").lower()

    if raw_status in {"match", "allowed", "success"}:
        status = "Success"
    elif raw_status in {"no_match", "denied", "failed"}:
        status = "Failed"
    else:
        status = log.match_result or "Unknown"

    user_name = get_names_from_booking(log.booking_id)

    if not user_name and log.fob:
        user_name = f"Fob Scanned: {log.fob.label}"
    snapshot_path = _get_adjusted_snapshot_path(log.snapshot_path)

    return {
        "id": log.id,
        "timestamp": log.time_logged.strftime("%Y-%m-%d %H:%M:%S")
        if log.time_logged else None,
        "method": log.event_type or "Unknown",
        "bnbName": log.bnb.name if log.bnb else "Unknown",
        "status": status,
        "match_raw": log.match_result,
        "confidence": log.face_confidence,
        "snapshot": snapshot_path,
        "fob": log.fob.label if log.fob else None,
        "user": user_name or "N/A",
    }


# ====================================================================
# GUEST ENDPOINTS
# ====================================================================

@access_bp.route("/guest/access/<string:booking_code>/history", methods=["GET"])
@jwt_required()
def get_booking_history(booking_code):
    user_id = int(get_jwt_identity())

    booking = Booking.query.filter_by(booking_code=booking_code).first()
    if not booking:
        return jsonify({"msg": "Booking not found"}), 404

    user_booking = UserBooking.query.filter_by(
        booking_id=booking.id, user_id=user_id
    ).first()
    is_host = booking.bnb and booking.bnb.host_id == user_id

    if not user_booking and not is_host:
        return jsonify({"msg": "Unauthorized"}), 403

    logs = (
        AccessLog.query
        .filter_by(booking_id=booking.id)
        .order_by(AccessLog.time_logged.desc())
        .all()
    )

    data = []
    for log in logs:
        user_name = get_names_from_booking(log.booking_id)

        if not user_name and log.fob:
            user_name = f"Fob Scanned: {log.fob.label}"

        snapshot_path = _get_adjusted_snapshot_path(log.snapshot_path)

        data.append({
            "id": log.id,
            "timestamp": log.time_logged.strftime("%Y-%m-%d %H:%M:%S")
            if log.time_logged else None,
            "method": log.event_type or "Unknown",
            "bnbName": log.bnb.name if log.bnb else "Unknown",
            "status": log.match_result or "Unknown",
            "confidence": log.face_confidence,
            "snapshot": snapshot_path,
            "fob": log.fob.label if log.fob else None,
            "user": user_name or "N/A",
        })

    return jsonify(data), 200


# ====================================================================
# HOST ENDPOINTS
# ====================================================================

@access_bp.route("/host/access/logs", methods=["GET"])
@jwt_required()
def get_host_access_logs():
    """All access logs for all BnBs owned by the current host."""
    host_id = int(get_jwt_identity())

    bnb_ids = [b.id for b in BnB.query.filter_by(host_id=host_id).all()]
    if not bnb_ids:
        return jsonify([]), 200

    logs = (
        AccessLog.query
        .filter(AccessLog.bnb_id.in_(bnb_ids))
        .order_by(AccessLog.time_logged.desc())
        .all()
    )

    data = [_serialise_log(log) for log in logs]
    return jsonify(data), 200


@access_bp.route("/bnbs/<int:bnb_id>/access_logs", methods=["GET"])
@jwt_required()
def get_access_logs_for_bnb(bnb_id):
    """Access logs for a single BnB, for host/admin."""
    user_id = int(get_jwt_identity())

    bnb = BnB.query.get(bnb_id)
    if not bnb:
        return jsonify({"msg": "BnB not found"}), 404

    if bnb.host_id != user_id:
        return jsonify({"msg": "Unauthorized"}), 403

    logs = (
        AccessLog.query
        .filter_by(bnb_id=bnb_id)
        .order_by(AccessLog.time_logged.desc())
        .all()
    )

    data = [_serialise_log(log) for log in logs]
    return jsonify(data), 200