from flask import Blueprint, Response, current_app, g, jsonify, request

from app.core.auth import require_auth
from app.services.export_service import build_inventory_csv, build_inventory_pdf
from app.services.inventory_service import (
    create_item,
    delete_item,
    get_item_by_code,
    get_item_by_id,
    list_inventory,
    list_expiring_inventory,
    update_item,
)


inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


@inventory_bp.get("")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def list_items():
    items = list_inventory(
        search=request.args.get("search"),
        category=request.args.get("category"),
        location=request.args.get("location"),
        low_stock=request.args.get("lowStock", "false").lower() == "true",
    )
    return jsonify({"items": items})


@inventory_bp.get("/expiring")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_expiring_items():
    days = int(request.args.get("days", 30))
    items = list_expiring_inventory(days=days)
    return jsonify({"items": items})


@inventory_bp.get("/<item_id>")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_item(item_id):
    try:
        item = get_item_by_id(item_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404

    return jsonify({"item": item})


@inventory_bp.get("/code/<item_code>")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_item_via_code(item_code):
    try:
        item = get_item_by_code(item_code)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404

    return jsonify({"item": item})


@inventory_bp.post("")
@require_auth(allowed_roles=["ADMIN"])
def create_inventory_item():
    payload = request.get_json(silent=True) or {}

    try:
        item = create_item(payload, g.current_user, current_app.config["LOW_STOCK_DEFAULT_THRESHOLD"])
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"item": item, "message": "Item created successfully"}), 201


@inventory_bp.put("/<item_id>")
@require_auth(allowed_roles=["ADMIN"])
def update_inventory_item(item_id):
    payload = request.get_json(silent=True) or {}

    try:
        item = update_item(item_id, payload, g.current_user)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"item": item, "message": "Item updated successfully"})


@inventory_bp.delete("/<item_id>")
@require_auth(allowed_roles=["ADMIN"])
def delete_inventory_item(item_id):
    try:
        delete_item(item_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"message": "Item deleted successfully"})


@inventory_bp.get("/export/csv")
@require_auth(allowed_roles=["ADMIN"])
def export_inventory_csv():
    csv_data = build_inventory_csv()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory-report.csv"},
    )


@inventory_bp.get("/export/pdf")
@require_auth(allowed_roles=["ADMIN"])
def export_inventory_pdf():
    pdf_bytes = build_inventory_pdf()
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": "attachment; filename=inventory-report.pdf"},
    )
