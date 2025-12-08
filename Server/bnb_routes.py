from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from .models import db, BnB, User
import uuid

bnb_bp = Blueprint("bnb", __name__)

def generate_unique_code():
    """Generates a simple unique code. In a real app, you'd ensure this is truly unique in the DB."""
    return str(uuid.uuid4())[:8].upper()

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
    """ Placeholder for listing all BnBs """
    return jsonify([]), 200

@bnb_bp.route("/bnbs", methods=["POST"])
@jwt_required()
def create_bnb():
    """
    Create a new BnB. Only callable by an authenticated HOST.
    """
    host_id = get_jwt_identity()
    user = User.query.get(host_id)

    if not user or not user.is_host():
        return jsonify({"msg": "Authorization failed. Only hosts can create BnBs."}), 403

    data = request.get_json()
    bnb_name = data.get("name")
    
    if not bnb_name:
        return jsonify({"msg": "Missing required field: name"}), 400

    # 1. Create the new BnB object
    new_bnb = BnB(
        name=bnb_name,
        unique_code=generate_unique_code(),
        host_id=host_id
    )

    # 2. Save to database
    try:
        db.session.add(new_bnb)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Database error during BnB creation: {e}")
        return jsonify({"msg": "Could not create BnB due to a database error."}), 500

    # 3. Return the new BnB details (critical for frontend update)
    return jsonify({
        "id": new_bnb.id,
        "name": new_bnb.name,
        "unique_code": new_bnb.unique_code,
        "host_id": new_bnb.host_id,
        "message": "BnB created successfully."
    }), 201

@bnb_bp.route("/bnbs/<int:bnb_id>", methods=["DELETE"])
@jwt_required()
def delete_bnb(bnb_id):
    """
    Delete a BnB. Only the owner (host) can delete it.
    """
    host_id = get_jwt_identity()
    bnb = BnB.query.get(bnb_id)
    
    if not bnb:
        return jsonify({"msg": "BnB not found"}), 404
    
    if bnb.host_id != host_id:
        return jsonify({"msg": "Authorization failed. You can only delete your own properties."}), 403
    
    try:
        db.session.delete(bnb)
        db.session.commit()
        return jsonify({"msg": "BnB deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Database error during BnB deletion: {e}")
        return jsonify({"msg": "Could not delete BnB due to a database error."}), 500