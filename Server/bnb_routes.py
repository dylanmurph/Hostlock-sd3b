from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, BnB

bnb_bp = Blueprint("bnb", __name__)

@bnb_bp.route("/bnbs/<int:bnb_id>", methods=["GET"])
@jwt_required()
def get_bnb(bnb_id):
    bnb = BnB.query.get(bnb_id)
    if not bnb:
        return jsonify({"message": "BnB not found"}), 404

    data = {
        "id": bnb.id,
        "unique_code": bnb.unique_code,
        "name": bnb.name,
        "host_id": bnb.host_id,
    }

    return jsonify(data), 200

@bnb_bp.route("/host/bnbs", methods=["GET"])
@jwt_required()
def get_host_bnbs():
    host_id = int(get_jwt_identity())
    bnbs = BnB.query.filter_by(host_id=host_id).all()
    return jsonify([{"id": bnb.id, "name": bnb.name} for bnb in bnbs]), 200


@bnb_bp.route("/bnbs", methods=["GET"])
@jwt_required()
def list_bnbs():
    """
    List all BnBs that the authenticated host/admin is allowed to manage.
    TODO:
    - Use get_jwt_identity() to identify user.
    - Filter BnBs by host or admin permissions.
    """
    return jsonify([]), 200


@bnb_bp.route("/bnbs", methods=["POST"])
@jwt_required()
def create_bnb():
    """
    Create a new BnB (admin or host).
    TODO:
    - Validate user role and request body.
    - Create BnB row and return details.
    """
    return jsonify({}), 201