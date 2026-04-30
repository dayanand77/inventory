from flask import Blueprint, g, jsonify, request, current_app
from app.core.auth import require_auth
from app.services.expiry_service import (
    get_expiring_items,
    get_expired_items,
    record_wastage,
    get_wastage_records,
    get_wastage_summary,
    get_expiry_alerts_summary,
)

expiry_bp = Blueprint("expiry", __name__, url_prefix="/api/expiry")


@expiry_bp.get("/alerts")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_alerts():
    """Get expiry alerts summary"""
    summary = get_expiry_alerts_summary()
    return jsonify(summary)


@expiry_bp.get("/expiring")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_expiring():
    """Get items expiring within specified days"""
    days = int(request.args.get("days", 30))
    items = get_expiring_items(days=days)
    return jsonify({"items": items, "count": len(items)})


@expiry_bp.get("/expired")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_expired():
    """Get already expired items"""
    items = get_expired_items()
    return jsonify({"items": items, "count": len(items)})


@expiry_bp.post("/wastage")
@require_auth(allowed_roles=["ADMIN"])
def record_item_wastage():
    """Record wastage of items"""
    payload = request.get_json(silent=True) or {}
    
    item_id = payload.get("itemId")
    quantity = payload.get("quantity")
    reason = payload.get("reason", "Unknown")
    
    try:
        wastage = record_wastage(item_id, quantity, reason, g.current_user)
        return jsonify({
            "wastage": wastage,
            "message": "Wastage recorded successfully"
        }), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@expiry_bp.get("/wastage")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_wastages():
    """Get wastage records with optional filtering"""
    item_id = request.args.get("itemId")
    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")
    
    try:
        records = get_wastage_records(
            item_id=item_id,
            start_date=start_date,
            end_date=end_date
        )
        return jsonify({"records": records, "count": len(records)})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@expiry_bp.get("/wastage/summary")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def wastage_summary():
    """Get wastage summary grouped by reason"""
    summary = get_wastage_summary()
    return jsonify({"summary": summary})
