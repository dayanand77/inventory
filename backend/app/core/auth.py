from datetime import datetime
from functools import wraps

from firebase_admin import auth
from flask import g, jsonify, request

from app.core.db import get_db
from app.core.firebase_admin_client import initialize_firebase_admin
from app.models.schemas import serialize_document


def verify_token_from_request():
    initialize_firebase_admin()

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise ValueError("Missing Bearer token")

    id_token = auth_header.split(" ", 1)[1].strip()
    if not id_token:
        raise ValueError("Empty token")

    return auth.verify_id_token(id_token)


def _get_or_create_user(token_payload):
    db = get_db()
    uid = token_payload["uid"]

    user = db.users.find_one({"uid": uid})
    if user:
        return user

    now = datetime.utcnow()
    user_doc = {
        "uid": uid,
        "email": token_payload.get("email", ""),
        "displayName": token_payload.get("name", ""),
        "role": "STAFF",
        "department": "",
        "createdAt": now,
        "updatedAt": now,
    }
    db.users.insert_one(user_doc)
    return db.users.find_one({"uid": uid})


def require_auth(allowed_roles=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                token_payload = verify_token_from_request()
                user = _get_or_create_user(token_payload)
            except Exception as exc:
                return jsonify({"error": f"Unauthorized: {str(exc)}"}), 401

            if allowed_roles and user.get("role") not in allowed_roles:
                return jsonify({"error": "Forbidden"}), 403

            g.current_user = serialize_document(user)
            g.token_payload = token_payload
            return func(*args, **kwargs)

        return wrapper

    return decorator
