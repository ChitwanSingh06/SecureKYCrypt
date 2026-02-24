from flask import Blueprint, request, jsonify
from services.telecom_service import get_owner_details
from services.ownership_service import calculate_ownership_score
from services.risk_service import calculate_total_risk
from config import RISK_THRESHOLD

verify_bp = Blueprint("verify", __name__)

@verify_bp.route("/verify", methods=["POST"])
def verify():
    data = request.json
    name = data.get("name")
    mobile = data.get("mobile")
    device = data.get("deviceInfo")
    behavior = data.get("behaviorInfo")

    telecom_data = get_owner_details(mobile)

    ownership_score = calculate_ownership_score(
        name, telecom_data
    )

    risk_score = calculate_total_risk(
        ownership_score, device, behavior
    )

    return jsonify({
        "telecom_owner": telecom_data.get("owner"),
        "ownership_score": ownership_score,
        "risk_score": risk_score,
        "status": "fraud" if risk_score > RISK_THRESHOLD else "safe"
    })