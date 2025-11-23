from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, BnB, Booking, User, UserBooking, Fob, FobBooking
import json

booking_bp = Blueprint("booking", __name__)

# GET CURRENT GUEST BOOKINGS
@booking_bp.route("/guest/get/booking", methods=["GET"])
@jwt_required()
def get_guest_bookings():
    user_id = int(get_jwt_identity())

    guest = User.query.filter_by(id=user_id).first()
    if not guest:
        return jsonify([]), 200

    # Step 1: Get UserBooking entries
    user_bookings = guest.bookings.all()

    # Step 2: Extract Booking objects
    bookings = [ub.booking for ub in user_bookings]

    data = []
    for b in bookings:
        data.append({
            "bookingCode": b.booking_code,
            "checkIn": b.check_in_time.strftime("%Y-%m-%d"),
            "checkInTime": b.check_in_time.strftime("%H:%M"),
            "checkOut": b.check_out_time.strftime("%Y-%m-%d"),
            "checkOutTime": b.check_out_time.strftime("%H:%M"),
            "bnb_id": b.bnb_id
        })

    return jsonify(data), 200


@booking_bp.route("/bookings", methods=["POST"])
@jwt_required()
def create_booking():
    """
    Create a new booking for a BnB.
    TODO:
    - Validate BnB, time window, guest IDs (must exist as users).
    - Create Booking row.
    - Create UserBooking rows for each guest.
    - Auto-assign fobs via FobBooking for the booking window.
    """
    return jsonify({}), 201


@booking_bp.route("/bookings/<int:booking_id>", methods=["GET"])
@jwt_required()
def get_booking(booking_id):
    """
    Get full booking details including guests and fobs.
    TODO:
    - Check user permissions for this booking.
    - Return booking, guests, and fob assignments.
    """
    return jsonify({}), 200


@booking_bp.route("/bookings/<int:booking_id>/add_guest", methods=["POST"])
@jwt_required()
def add_guest_to_booking(booking_id):
    """
    Add an existing user to an existing booking.
    TODO:
    - Validate user_id exists.
    - Ensure user is not already linked.
    - Create UserBooking row.
    """
    return jsonify({}), 200


@booking_bp.route("/bookings/<int:booking_id>/remove_guest", methods=["POST"])
@jwt_required()
def remove_guest_from_booking(booking_id):
    """
    Remove a guest from a booking.
    TODO:
    - Validate user_id exists and is linked.
    - Delete or deactivate UserBooking.
    - Optionally adjust fob logic if needed.
    """
    return jsonify({}), 200


@booking_bp.route("/bnbs/<int:bnb_id>/bookings/current", methods=["GET"])
@jwt_required()
def list_current_bookings_for_bnb(bnb_id):
    """
    List active and upcoming bookings for a given BnB.
    TODO:
    - Filter bookings by time (now to future).
    - Ensure caller has permission to view this BnB.
    """
    return jsonify([]), 200
