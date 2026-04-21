from datetime import datetime

from flask import Blueprint, g, jsonify, request

from app.core.auth import require_auth
from app.core.db import get_db
from app.models.schemas import serialize_document


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
ALLOWED_ROLES = {"ADMIN", "STAFF"}


@auth_bp.post("/sync")
@require_auth()
def sync_user_profile():
    db = get_db()
    payload = request.get_json(silent=True) or {}
    current_user = g.current_user

    users_count = db.users.count_documents({})
    requested_role = str(payload.get("role", current_user.get("role", "STAFF"))).upper()

    if requested_role not in ALLOWED_ROLES:
        requested_role = "STAFF"

    # Only the very first user can self-bootstrap as ADMIN.
    if requested_role == "ADMIN":
        if users_count > 1 and current_user.get("role") != "ADMIN":
            requested_role = current_user.get("role", "STAFF")

    update = {
        "displayName": payload.get("displayName", current_user.get("displayName", "")),
        "department": payload.get("department", current_user.get("department", "")),
        "email": current_user.get("email", ""),
        "role": requested_role,
        "updatedAt": datetime.utcnow(),
    }

    db.users.update_one({"uid": current_user.get("uid")}, {"$set": update}, upsert=True)
    updated_user = db.users.find_one({"uid": current_user.get("uid")})

    return jsonify({"user": serialize_document(updated_user)})


@auth_bp.get("/me")
@require_auth()
def get_me():
    db = get_db()
    user = db.users.find_one({"uid": g.current_user.get("uid")})
    return jsonify({"user": serialize_document(user)})


@auth_bp.get("/users")
@require_auth(allowed_roles=["ADMIN"])
def list_users():
    db = get_db()
    users = list(db.users.find({}).sort("createdAt", -1))
    return jsonify({"users": serialize_document(users)})


@auth_bp.patch("/users/<uid>/role")
@require_auth(allowed_roles=["ADMIN"])
def update_user_role(uid):
    db = get_db()
    payload = request.get_json(silent=True) or {}
    new_role = str(payload.get("role", "")).upper()

    if new_role not in ALLOWED_ROLES:
        return jsonify({"error": "Invalid role"}), 400

    db.users.update_one(
        {"uid": uid},
        {"$set": {"role": new_role, "updatedAt": datetime.utcnow()}},
    )
    user = db.users.find_one({"uid": uid})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": serialize_document(user)})
