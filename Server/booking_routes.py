from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, BnB, Booking, User, UserBooking, Fob, FobBooking, UserRole
from datetime import datetime, timezone
import os
from werkzeug.utils import secure_filename
from sqlalchemy import or_

booking_bp = Blueprint("booking", __name__)

# GUEST BOOKINGS

@booking_bp.route("/guest/get/booking", methods=["GET"])
@jwt_required()
def get_guest_bookings():
    user_id = int(get_jwt_identity())
    guest = User.query.get(user_id)
    if not guest:
        return jsonify([]), 200

    # Retrieve and format all bookings for the guest
    data = [
        {
            "bookingCode": ub.booking.booking_code,
            "checkIn": ub.booking.check_in_time.strftime("%Y-%m-%d"),
            "checkInTime": ub.booking.check_in_time.strftime("%H:%M"),
            "checkOut": ub.booking.check_out_time.strftime("%Y-%m-%d"),
            "checkOutTime": ub.booking.check_out_time.strftime("%H:%M"),
            "bnb_id": ub.booking.bnb_id
        }
        for ub in guest.bookings.all()
    ]
    return jsonify(data), 200

# ==============================
# HOST: GUEST DIRECTORY (for select dropdown)
# ==============================

@booking_bp.route("/host/guests", methods=["GET"])
@jwt_required()
def get_host_guest_directory():
    """
    Return a simple directory of all guest users
    (id, name, email) so hosts can pick from a dropdown.
    """
    host_id = int(get_jwt_identity())

    # Optional: only allow hosts / admins to call this
    host = User.query.get(host_id)
    if not host or host.role not in [UserRole.HOST, UserRole.ADMIN]:
        return jsonify({"error": "Not authorized"}), 403

    guests = (
        User.query
        .filter_by(role=UserRole.GUEST)
        .order_by(User.name.asc())
        .all()
    )

    data = [
        {
            "id": g.id,
            "name": g.name,
            "email": g.email,
        }
        for g in guests
    ]

    return jsonify(data), 200

# HOST BOOKINGS

@booking_bp.route("/host/get/bookings", methods=["GET"])
@jwt_required()
def get_host_bookings():
    host_id = int(get_jwt_identity())
    bnbs = BnB.query.filter_by(host_id=host_id).all()
    if not bnbs:
        return jsonify([]), 200

    now = datetime.now(timezone.utc)
    data = []

    for bnb in bnbs:
        for booking in bnb.bookings:
            # Handle non-timezone aware datetimes
            check_in = booking.check_in_time.replace(tzinfo=timezone.utc) if booking.check_in_time.tzinfo is None else booking.check_in_time
            check_out = booking.check_out_time.replace(tzinfo=timezone.utc) if booking.check_out_time.tzinfo is None else booking.check_out_time

            # Determine status
            status = (
                "Active" if check_in <= now <= check_out else
                "Upcoming" if now < check_in else
                "Checked Out"
            )

            fob_uid = None
            fob_label = None
            if booking.fob_links:
                fob_booking_link = booking.fob_links[0]
                fob = fob_booking_link.fob
                fob_uid = fob.uid
                fob_label = fob.label

            # Generate data for all linked guests
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
                    "fobUID": fob_uid,
                    "bookingId": booking.id,
                    "fobLabel": fob_label
                })

    return jsonify(data), 200

# PROFILE IMAGE MANAGEMENT

@booking_bp.route("/booking/uploadImage", methods=["POST"])
@jwt_required()
def upload_profile_image():
    user_id = int(get_jwt_identity())
    
    # Check for file presence
    if "image" not in request.files or request.files["image"].filename == "":
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    filename = secure_filename(f"user_{user_id}_" + file.filename)
    upload_folder = "uploads/profile_images" 
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    # Save path in DB
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.photo_path = file_path
    db.session.commit()

    return jsonify({"message": "Profile image uploaded", "file_path": file_path}), 200
    
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
    check_out = data.get("CheckOut") if data.get("CheckOut") else data.get("checkOut")
    property_id = data.get("property") 

    # 1. Missing Fields Check (400)
    if not all([email, booking_code, check_in, check_out, property_id]):
        return jsonify({"error": "Missing required fields."}), 400

    # 2. Date Format Check (400)
    try:
        check_in_time = datetime.fromisoformat(check_in)
        check_out_time = datetime.fromisoformat(check_out)
    except ValueError:
        return jsonify({"error": "Incorrect date format. Use YYYY-MM-DDTHH:MM:SS."}), 400

    # 3. Booking Code Uniqueness (409)
    if Booking.query.filter_by(booking_code=booking_code).first():
        return jsonify({"error": f"Booking code '{booking_code}' already in use."}), 409
    
    # 4. Find or create guest user
    user = User.query.filter_by(email=email).first()
    if not user:
        try:
            user = User(email=email, name="Guest", role=UserRole.GUEST) 
        except NameError:
            user = User(email=email, name="Guest", role="guest") 
            
        user.set_password("placeholder_password")
        db.session.add(user)

    # 5. Role Check (403)
    if user.role != 'guest':
        return jsonify({"error": f"User {email} has a non-guest role and cannot be booked."}), 403

    # 6. User Overlap Check (409)
    conflicting_bookings = db.session.query(Booking).join(UserBooking).filter(
        UserBooking.user_id == user.id,
        (Booking.check_in_time < check_out_time) & (Booking.check_out_time > check_in_time)
    ).all()
    
    if conflicting_bookings:
        conflict_codes = [b.booking_code for b in conflicting_bookings]
        return jsonify({"error": f"Guest has conflicting reservation(s): {', '.join(conflict_codes)}."}), 409

    # 7. Property Existence Check (404)
    bnb = BnB.query.get(property_id)
    if not bnb:
        return jsonify({"error": "Property not found."}), 404

    # 8. Booking Creation and Fob Assignment
    try:
        booking = Booking(
            bnb=bnb,
            booking_code=booking_code,
            check_in_time=check_in_time,
            check_out_time=check_out_time
        )
        db.session.add(booking)
        db.session.commit()

        user_booking = UserBooking(user=user, booking=booking, is_primary_guest=True)
        db.session.add(user_booking)
        db.session.commit()

        # Find available Fob
        fob = Fob.query.outerjoin(FobBooking).filter(
            or_(
                FobBooking.id == None,
                (FobBooking.active_until < check_in_time) | (FobBooking.active_from > check_out_time)
            )
        ).first()

        fob_uid = None
        if fob:
            fob_booking = FobBooking(
                fob=fob,
                booking=booking,
                active_from=check_in_time,
                active_until=check_out_time,
                is_active=True
            )
            db.session.add(fob_booking)
            db.session.commit()
            fob_uid = fob.uid

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Server error while saving booking. Transaction rolled back."}), 500

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

# ACCESS MANAGEMENT

@booking_bp.route("/bookings/<int:booking_id>/fob_assign", methods=["POST"])
@jwt_required()
def assign_fob_to_booking(booking_id):
    data = request.json
    fob_uid = data.get("fobUID")
    host_id = int(get_jwt_identity())

    if not fob_uid:
        return jsonify({"error": "Missing input: 'fobUID' is required."}), 400

    booking = Booking.query.get(booking_id)
    fob = Fob.query.filter_by(uid=fob_uid).first()

    if not booking:
        return jsonify({"error": f"Booking ID '{booking_id}' not found."}), 404
    
    if not fob:
        return jsonify({"error": f"Fob UID '{fob_uid}' is unregistered."}), 404
    
    # Authorization Check
    if booking.bnb.host_id != host_id:
        return jsonify({"error": "Authorization failed. User is not the host of this property."}), 403

    # Remove existing Fob link
    FobBooking.query.filter_by(booking_id=booking_id).delete()

    # Create new FobBooking link
    try:
        fob_booking = FobBooking(
            fob=fob,
            booking=booking,
            active_from=booking.check_in_time,
            active_until=booking.check_out_time,
            is_active=True
        )
        db.session.add(fob_booking)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database error during Fob assignment."}), 500
    
    return jsonify({"message": "Fob assigned successfully.", "fobUID": fob_uid}), 200

# GUEST MANAGEMENT

@booking_bp.route("/bookings/<int:booking_id>/add_guest", methods=["POST"])
@jwt_required()
def add_guest_to_booking(booking_id):
    data = request.json
    guest_email = data.get("email")
    host_id = int(get_jwt_identity())

    if not guest_email:
        return jsonify({"error": "Missing input: guest 'email' is required."}), 400

    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": f"Booking ID '{booking_id}' not found."}), 404
    
    # Authorization Check
    if booking.bnb.host_id != host_id:
        return jsonify({"error": "Authorization failed. User is not the host of this property."}), 403

    # 1. Find or create the guest user
    guest = User.query.filter_by(email=guest_email).first()
    if not guest:
        try:
            guest = User(email=guest_email, name="Guest", role=UserRole.GUEST) 
        except NameError:
            guest = User(email=guest_email, name="Guest", role="guest") 
        guest.set_password("placeholder_password") 
        db.session.add(guest)
        db.session.commit()
    
    # 2. Role Check (403)
    if guest.role != 'guest': 
        return jsonify({"error": f"User '{guest_email}' has role '{guest.role}'. Only 'guest' roles can be added."}), 403

    # 3. Overlap Check (409)
    conflicting_bookings = db.session.query(Booking).join(UserBooking).filter(
        UserBooking.user_id == guest.id,
        (Booking.check_in_time < booking.check_out_time) & (Booking.check_out_time > booking.check_in_time),
        Booking.id != booking_id 
    ).all()
    
    if conflicting_bookings:
        return jsonify({"error": "Guest has an overlapping booking."}), 409

    # 4. Already linked check (409)
    if UserBooking.query.filter_by(user_id=guest.id, booking_id=booking_id).first():
        return jsonify({"error": f"User '{guest_email}' is already a guest for this booking."}), 409

    # 5. Link user to booking
    try:
        user_booking = UserBooking(user=guest, booking=booking, is_primary_guest=False)
        db.session.add(user_booking)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database error during guest removal."}), 500

    return jsonify({"message": "Secondary guest added successfully.", "guestId": guest.id, "email": guest.email}), 200

# GUEST MANAGEMENT

@booking_bp.route("/bookings/<int:booking_id>/guests", methods=["GET"])
@jwt_required()
def get_associated_guests(booking_id):
    host_id = int(get_jwt_identity())
    
    booking = Booking.query.get(booking_id)

    if not booking:
        return jsonify({"error": f"Booking ID '{booking_id}' not found."}), 404
    
    # Authorization Check
    if booking.bnb.host_id != host_id:
        return jsonify({"error": "Authorization failed. User is not the host of this property."}), 403

    # Fetch all linked users (primary and secondary)
    guest_data = []
    for user_booking in booking.user_links:
        guest = user_booking.user
        guest_data.append({
            "id": guest.id,
            "email": guest.email,
            "name": guest.name,
            "isPrimaryGuest": user_booking.is_primary_guest
        })

    return jsonify(guest_data), 200

@booking_bp.route("/bookings/<int:booking_id>", methods=["PUT"])
@jwt_required()
def update_booking(booking_id):
    host_id = int(get_jwt_identity())
    data = request.json
    new_booking_code = data.get("bookingCode")
    
    booking = Booking.query.get(booking_id)

    # 1. Existence/Authorization Checks
    if not booking:
        return jsonify({"error": f"Booking ID '{booking_id}' not found."}), 404
    if booking.bnb.host_id != host_id:
        return jsonify({"error": "Authorization failed. User is not the host."}), 403

    # 2. Input/Value Check
    if not new_booking_code:
        return jsonify({"error": "Missing input: 'bookingCode' is required."}), 400

    if new_booking_code == booking.booking_code:
        return jsonify({"message": "Update skipped. Code is unchanged.", "bookingId": booking.id}), 200

    # 3. Uniqueness Check (409)
    if Booking.query.filter(Booking.booking_code == new_booking_code, Booking.id != booking_id).first():
        return jsonify({"error": f"Booking Code '{new_booking_code}' already in use."}), 409
             
    # 4. Apply and Commit
    booking.booking_code = new_booking_code
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database error during booking code update."}), 500

    return jsonify({"message": "Booking code updated successfully.", "newBookingCode": booking.booking_code}), 200

@booking_bp.route("/bookings/<int:booking_id>", methods=["DELETE"])
@jwt_required()
def delete_booking(booking_id):
    host_id = int(get_jwt_identity())
    
    booking = Booking.query.get(booking_id)

    # 1. Existence Check
    if not booking:
        return jsonify({"error": f"Booking ID '{booking_id}' not found."}), 404

    # 2. Authorization Check
    if booking.bnb.host_id != host_id:
        return jsonify({"error": "Authorization failed. User is not the host of this property."}), 403
    
    try:
        # 3. Cleanup Linked Tables (Crucial Step)
        UserBooking.query.filter_by(booking_id=booking_id).delete()
        FobBooking.query.filter_by(booking_id=booking_id).delete()
        db.session.delete(booking)
        db.session.commit()
        
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database error during booking deletion. Transaction rolled back."}), 500

    return jsonify({"message": f"Booking ID '{booking_id}' and all associated links deleted successfully."}), 200

@booking_bp.route("/bookings/<int:booking_id>/remove_guest", methods=["POST"])
@jwt_required()
def remove_guest_from_booking(booking_id):
    data = request.json
    guest_id = data.get("guestId")
    host_id = int(get_jwt_identity())

    if not guest_id:
        return jsonify({"error": "Missing input: 'guestId' is required."}), 400

    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": f"Booking ID '{booking_id}' not found."}), 404

    # Authorization Check
    if booking.bnb.host_id != host_id:
        return jsonify({"error": "Authorization failed. User is not the host."}), 403
    
    # Find the link
    user_booking_link = UserBooking.query.filter_by(user_id=guest_id, booking_id=booking_id).first()
    
    if not user_booking_link:
        return jsonify({"error": f"Guest ID '{guest_id}' not linked to booking '{booking_id}'."}), 404

    # Prevent removing the primary guest (400)
    if user_booking_link.is_primary_guest:
        return jsonify({"error": "Cannot remove primary guest. Delete booking instead."}), 400

    # Delete the link
    try:
        db.session.delete(user_booking_link)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Database error during guest removal."}), 500

    return jsonify({"message": "Secondary guest removed successfully.", "guestId": guest_id}), 200

# ===================================
# NEW: GUEST CANCEL THEIR OWN BOOKING
# ===================================
@booking_bp.route("/guest/booking/<string:booking_code>", methods=["DELETE"])
@jwt_required()
def cancel_guest_booking(booking_code):
    """
    Guest cancels their own booking by booking code.
    If they are the only guest, delete the whole booking.
    If there are multiple guests, just remove this user from it.
    """
    user_id = int(get_jwt_identity())

    booking = Booking.query.filter_by(booking_code=booking_code).first()
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    # Check this user is actually linked to the booking
    link = UserBooking.query.filter_by(
        user_id=user_id, booking_id=booking.id
    ).first()

    if not link:
        return jsonify({"error": "You are not linked to this booking"}), 404

    # If more than one guest, just remove this user from the booking
    if booking.user_links.count() > 1:
        db.session.delete(link)
        db.session.commit()
        return jsonify({"message": "You have been removed from this booking"}), 200

    # Otherwise, they are the only guest -> delete booking + links + fobs
    for fb in list(booking.fob_links):
        db.session.delete(fb)

    db.session.delete(link)
    db.session.delete(booking)
    db.session.commit()

    return jsonify({"message": "Booking cancelled"}), 200