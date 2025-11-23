from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, AccessLog, BnB, Booking, UserBooking

access_bp = Blueprint("access", __name__)

@access_bp.route("/guest/access/<string:booking_code>/history", methods=["GET"])
@jwt_required()
def get_booking_history(booking_code):
    user_id = int(get_jwt_identity())

    # Ensure the user is part of this booking
    booking = Booking.query.filter_by(booking_code=booking_code).first()
    if not booking:
        return jsonify({"msg": "Booking not found"}), 404

    user_booking = UserBooking.query.filter_by(booking_id=booking.id, user_id=user_id).first()
    if not user_booking:
        return jsonify({"msg": "Unauthorized"}), 403

    # Query access logs for this booking
    logs = AccessLog.query.filter_by(booking_id=booking.id).order_by(AccessLog.time_logged.desc()).all()

    data = []
    for log in logs:
        data.append({
            "timestamp": log.time_logged.strftime("%Y-%m-%d %H:%M:%S") if log.time_logged else None,
            "method": log.event_type or "Unknown",
            "location": log.bnb.name if log.bnb else "Unknown",
            "status": log.match_result or "Unknown",
            "confidence": log.face_confidence if log.face_confidence is not None else None,
            "snapshot": log.snapshot_path if log.snapshot_path else None,
            "fob": log.fob.label if log.fob else None, 
            "user": log.recognized_user.name if log.recognized_user else None
        })

    return jsonify(data), 200

@access_bp.route("/bnbs/<int:bnb_id>/access_logs", methods=["GET"])
@jwt_required()
def get_access_logs_for_bnb(bnb_id):
    """
    Return access logs for a BnB.
    TODO:
    - Check permissions (host/admin).
    - Filter access logs by BnB, date range, etc (query params).
    """
    return jsonify([]), 200
