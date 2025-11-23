from flask import Blueprint, request, jsonify
from .models import (
    db,
    User,
    BnB,
    Booking,
    UserBooking,
    Fob,
    FobBooking,
    AccessLog,
    TamperAlert,
    UserRole,
)
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import re
from . import bcrypt

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"
CONTACT_REGEX = r"^\+?\d{7,15}$"
VALID_ROLES = ["guest", "host", "admin"]

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()  # {"id": ..., "role": ...}
    user = User.query.get(identity["id"])
    if not user:
        return jsonify({"message": "User not found"}), 404
    return (
        jsonify(
            {
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            }
        ),
        200,
    )


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    name = data.get("name")
    email = data.get("email", "").lower()
    password = data.get("password")
    contact_number = data.get("contact_number")
    role = data.get("role", "guest").lower()

    # Normalise old "user" role to "guest"
    if role == "user":
        role = "guest"

    if not name or not email or not password:
        return jsonify({"message": "Name, email, and password are required"}), 400
    if not re.match(EMAIL_REGEX, email):
        return jsonify({"message": "Invalid email format"}), 400
    if contact_number and not re.match(CONTACT_REGEX, contact_number):
        return jsonify({"message": "Invalid contact number format"}), 400
    if role not in VALID_ROLES:
        return jsonify({"message": f"Invalid role. Must be one of {VALID_ROLES}."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400

    # Role string has already been validated against VALID_ROLES,
    # so we can safely store it directly on the User model.
    user = User(name=name, email=email, contact_number=contact_number, role=role)
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role}
        )

        return (
            jsonify(
                {
                    "message": f"{role.capitalize()} registered successfully",
                    "access_token": access_token,
                    "user_id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error registering user", "error": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = data.get("email", "").lower()
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    if not user.check_password(password):
        return jsonify({"message": "Invalid password"}), 401

    user.last_login_at = datetime.utcnow()
    db.session.commit()
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    return (
        jsonify(
            {
                "message": "Login successful",
                "access_token": access_token,
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            }
        ),
        200,
    )
