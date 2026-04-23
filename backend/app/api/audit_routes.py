from flask import Blueprint, jsonify, request

from app.core.auth import require_auth
from app.services.audit_service import list_audit_logs

audit_bp = Blueprint("audit", __name__, url_prefix="/api/audit")

@audit_bp.get("")
@require_auth(allowed_roles=["ADMIN"])
def get_audit_logs():
    limit = int(request.args.get("limit", 100))
    logs = list_audit_logs(limit=limit)
    return jsonify({"logs": logs})
