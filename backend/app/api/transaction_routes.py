from flask import Blueprint, g, jsonify, request

from app.core.auth import require_auth
from app.services.transaction_service import (
    approve_request,
    create_request,
    issue_item,
    list_transactions,
    return_item,
)


transaction_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")


@transaction_bp.get("")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_transactions():
    transactions = list_transactions(
        current_user=g.current_user,
        transaction_type=request.args.get("type"),
        status=request.args.get("status"),
    )
    return jsonify({"transactions": transactions})


@transaction_bp.post("/request")
@require_auth(allowed_roles=["STAFF", "ADMIN"])
def request_item():
    payload = request.get_json(silent=True) or {}

    try:
        transaction = create_request(payload, g.current_user)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"transaction": transaction, "message": "Request submitted"}), 201


@transaction_bp.post("/issue")
@require_auth(allowed_roles=["ADMIN"])
def issue_inventory_item():
    payload = request.get_json(silent=True) or {}

    try:
        result = issue_item(payload, g.current_user)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"result": result, "message": "Item issued successfully"}), 201


@transaction_bp.post("/return")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def return_inventory_item():
    payload = request.get_json(silent=True) or {}

    try:
        result = return_item(payload, g.current_user)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"result": result, "message": "Item returned successfully"}), 201


@transaction_bp.post("/requests/<request_id>/approve")
@require_auth(allowed_roles=["ADMIN"])
def approve_inventory_request(request_id):
    try:
        result = approve_request(request_id, g.current_user)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"result": result, "message": "Request approved and issued"})
