from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone

# Assuming .models is correct for your environment
from .models import db, TamperAlert, BnB, User 

tamper_bp = Blueprint("tamper", __name__)

# HOST ALERTS ROUTES (Uses TamperAlert Model) 

@tamper_bp.route("/host/get/alerts", methods=["GET"])
@jwt_required()
def get_host_alerts():
    """
    Fetches all tamper alerts for the current host's BnBs.
    """
    host_id = int(get_jwt_identity())

    # Step 1: Find all BnB IDs associated with the current host
    hosted_bnbs = BnB.query.filter_by(host_id=host_id).all()
    if not hosted_bnbs:
        return jsonify([]), 200

    bnb_ids = [bnb.id for bnb in hosted_bnbs]
    
    # Create a quick lookup dictionary for BnB names
    bnb_name_lookup = {bnb.id: bnb.name for bnb in hosted_bnbs}

    # Step 2: Fetch all TamperAlerts for the host's BnBs
    alerts = TamperAlert.query.filter(
        TamperAlert.bnb_id.in_(bnb_ids)
    ).order_by(TamperAlert.triggered_at.desc()).all()

    # Step 3: Format the data
    data = []
    for alert in alerts:
        message = f"Tamper Alert triggered at the entrance device."
        
        data.append({
            "alertId": alert.id,
            "bnbId": alert.bnb_id,
            "bnbName": bnb_name_lookup.get(alert.bnb_id, "Unknown BnB"),
            "message": message,
            "eventType": "Tamper Alert", 
            "triggeredAt": alert.triggered_at.strftime("%Y-%m-%d %H:%M:%S"),
            # ADDITION: Include the status from the database (REQUIRED BY FRONTEND)
            "status": alert.status,
            # isRead is defaulted as the TamperAlert table does not have this column
            "isRead": False 
        })

    return jsonify(data), 200


@tamper_bp.route("/bnbs/<int:bnb_id>/tamper_alerts", methods=["GET"])
@jwt_required()
def get_tamper_alerts_for_bnb(bnb_id):
    """
    Returns tamper alerts for a specific BnB ID.
    """
    host_id = int(get_jwt_identity())
    
    # 1. Check if the user is the host of this BnB
    bnb = BnB.query.filter_by(id=bnb_id).first()
    if not bnb or bnb.host_id != host_id:
        return jsonify({"msg": "BnB not found or unauthorized"}), 403

    # 2. Fetch tamper alerts for the specific BnB
    alerts = TamperAlert.query.filter_by(bnb_id=bnb_id).order_by(TamperAlert.triggered_at.desc()).all()
    
    data = []
    for alert in alerts:
        data.append({
            "alertId": alert.id,
            "message": "Tamper Alert Triggered",
            "triggeredAt": alert.triggered_at.strftime("%Y-%m-%d %H:%M:%S"),
            # ADDITION: Status is needed here too for consistent display
            "status": alert.status, 
        })

    return jsonify(data), 200

@tamper_bp.route("/host/alerts/resolve/<int:alert_id>", methods=["PUT"])
@jwt_required()
def resolve_host_alert(alert_id):
    """
    Marks a specific TamperAlert as 'resolved' after verifying host ownership.
    """
    host_id = int(get_jwt_identity())

    try:
        # 1. Find the alert by its primary key 'id'
        alert = TamperAlert.query.get(alert_id)

        if not alert:
            return jsonify({"msg": "Alert not found"}), 404
        
        # 2. Authorization Check: Ensure the host owns the BnB
        bnb = BnB.query.filter_by(id=alert.bnb_id).first()
        
        if not bnb or bnb.host_id != host_id:
            return jsonify({"msg": "Unauthorized to resolve this alert"}), 403

        # 3. Update the status field 
        alert.status = 'resolved'
        
        # 4. Commit the change
        db.session.commit()

        return jsonify({"message": f"Alert {alert_id} resolved successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Database error resolving alert {alert_id}: {e}")
        return jsonify({"msg": "Internal server error during database update"}), 500