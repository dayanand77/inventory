from flask import Blueprint, g, jsonify, request

from app.core.auth import require_auth
from app.services.supplier_service import (
    create_supplier,
    delete_supplier,
    get_supplier_by_id,
    list_suppliers,
    update_supplier,
)


supplier_bp = Blueprint("supplier", __name__, url_prefix="/api/suppliers")


@supplier_bp.get("")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def list_all_suppliers():
    suppliers = list_suppliers(search=request.args.get("search"))
    return jsonify({"suppliers": suppliers})


@supplier_bp.get("/<supplier_id>")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_supplier(supplier_id):
    try:
        supplier = get_supplier_by_id(supplier_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404

    return jsonify({"supplier": supplier})


@supplier_bp.post("")
@require_auth(allowed_roles=["ADMIN"])
def create_new_supplier():
    payload = request.get_json(silent=True) or {}

    try:
        supplier = create_supplier(payload, g.current_user)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"supplier": supplier, "message": "Supplier created successfully"}), 201


@supplier_bp.put("/<supplier_id>")
@require_auth(allowed_roles=["ADMIN"])
def update_existing_supplier(supplier_id):
    payload = request.get_json(silent=True) or {}

    try:
        supplier = update_supplier(supplier_id, payload, g.current_user)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"supplier": supplier, "message": "Supplier updated successfully"})


@supplier_bp.delete("/<supplier_id>")
@require_auth(allowed_roles=["ADMIN"])
def delete_existing_supplier(supplier_id):
    try:
        delete_supplier(supplier_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"message": "Supplier deleted successfully"})
