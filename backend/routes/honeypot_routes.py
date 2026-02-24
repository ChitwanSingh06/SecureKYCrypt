from flask import Blueprint, jsonify

honeypot_bp = Blueprint("honeypot", __name__)

@honeypot_bp.route("/honeypot-log", methods=["POST"])
def log_honeypot():
    return jsonify({"message": "Suspicious interaction logged"})