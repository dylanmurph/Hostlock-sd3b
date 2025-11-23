from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, BnB, Booking, User, UserBooking, Fob, FobBooking
import json
from datetime import datetime, timezone
import os
from werkzeug.utils import secure_filename

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

@booking_bp.route("/host/get/bookings", methods=["GET"])
@jwt_required()
def get_host_bookings():
    host_id = int(get_jwt_identity())

    # Fetch all BnBs hosted by this user
    bnbs = BnB.query.filter_by(host_id=host_id).all()
    if not bnbs:
        return jsonify([]), 200

    # Current time as timezone-aware UTC
    now = datetime.now(timezone.utc)

    data = []

    for bnb in bnbs:
        for booking in bnb.bookings:
            # Ensure check_in_time and check_out_time are timezone-aware
            check_in = booking.check_in_time
            check_out = booking.check_out_time

            if check_in.tzinfo is None:
                check_in = check_in.replace(tzinfo=timezone.utc)
            if check_out.tzinfo is None:
                check_out = check_out.replace(tzinfo=timezone.utc)

            # Determine booking status
            if check_in <= now <= check_out:
                status = "Active"
            elif now < check_in:
                status = "Upcoming"
            else:
                status = "Checked Out"

            for user_booking in booking.user_links:
                guest = user_booking.user
                data.append({
                    "guestId": guest.id,
                    "guestName": guest.name,
                    "email": guest.email,
                    "bookingCode": booking.booking_code,
                    "checkIn": check_in.strftime("%Y-%m-%d"),
                    "checkInTime": check_in.strftime("%H:%M"),
                    "checkOut": check_out.strftime("%Y-%m-%d"),
                    "checkOutTime": check_out.strftime("%H:%M"),
                    "bnbId": bnb.id,
                    "bnbName": bnb.name,
                    "isPrimaryGuest": user_booking.is_primary_guest,
                    "status": status,
                    "fobUID": booking.fob_links[0].fob.uid if booking.fob_links else None,
                    "bookingId": booking.id
                })

    return jsonify(data), 200

@booking_bp.route("/booking/uploadImage", methods=["POST"])
@jwt_required()
def upload_profile_image():
    user_id = int(get_jwt_identity())

    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # Clean filename
    filename = secure_filename(f"user_{user_id}_" + file.filename)

    # Upload folder
    upload_folder = "uploads/profile_images"  # relative to your project
    os.makedirs(upload_folder, exist_ok=True)

    # Save file to disk
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    # Save path in DB
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.photo_path = file_path
    db.session.commit()

    return jsonify({
        "message": "Profile image uploaded",
        "file_path": file_path
    }), 200
    
@booking_bp.route("/booking/getImage", methods=["GET"])
@jwt_required()
def get_user_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "name": user.name,
        "email": user.email,
        "photo_path": user.photo_path
    }), 200

@booking_bp.route("/booking/createBooking", methods=["POST"])
def create_booking():
    data = request.json
    email = data.get("email")
    booking_code = data.get("bookingCode")
    check_in = data.get("checkIn")
    check_out = data.get("checkOut")
    property_name = data.get("property")

    if not all([email, booking_code, check_in, check_out, property_name]):
        return jsonify({"error": "Missing required fields"}), 400

    # Find or create user
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email, role="guest")
        db.session.add(user)
        db.session.commit()

    # Find BnB
    bnb = BnB.query.filter_by(name=property_name).first()
    if not bnb:
        return jsonify({"error": "Property not found"}), 404

    # Create booking
    booking = Booking(
        bnb=bnb,
        booking_code=booking_code,
        check_in_time=datetime.fromisoformat(check_in),
        check_out_time=datetime.fromisoformat(check_out),
    )
    db.session.add(booking)
    db.session.commit()

    # Link user to booking
    user_booking = UserBooking(user=user, booking=booking, is_primary_guest=True)
    db.session.add(user_booking)
    db.session.commit()

    # Assign first available Fob
    fob = (
        Fob.query
        .outerjoin(FobBooking)
        .filter(
            (FobBooking.id == None) |  # Fob has no bookings at all
            ((FobBooking.active_until < booking.check_in_time) | (FobBooking.active_from > booking.check_out_time))  # No overlap
        )
        .first()
    )

    if fob:
        fob_booking = FobBooking(
            fob=fob,
            booking=booking,
            active_from=datetime.fromisoformat(check_in),
            active_until=datetime.fromisoformat(check_out),
            is_active=True
        )
        db.session.add(fob_booking)
        db.session.commit()
        fob_uid = fob.uid
    else:
        fob_uid = None  # No available Fob

    return jsonify({
        "bookingId": booking.id,
        "email": user.email,
        "bookingCode": booking.booking_code,
        "checkIn": check_in,
        "checkOut": check_out,
        "bnbName": bnb.name,
        "fobUID": fob_uid,
        "status": "Active"
    }), 201

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
