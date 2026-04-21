from flask import Blueprint, jsonify

from app.core.auth import require_auth
from app.services.notification_service import (
    generate_low_stock_notifications,
    list_notifications,
    mark_notification_as_read,
)


notification_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notification_bp.get("")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_notifications():
    notifications = list_notifications()
    return jsonify({"notifications": notifications})


@notification_bp.post("/generate-low-stock")
@require_auth(allowed_roles=["ADMIN"])
def generate_notifications():
    notifications = generate_low_stock_notifications()
    return jsonify({"notifications": notifications, "message": "Notifications generated"})


@notification_bp.patch("/<notification_id>/read")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def mark_as_read(notification_id):
    try:
        notification = mark_notification_as_read(notification_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"notification": notification})
