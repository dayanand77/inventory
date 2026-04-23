from datetime import datetime

from app.core.db import get_db
from app.models.schemas import serialize_document

def _collection():
    return get_db().audit_logs

def log_action(user_uid: str, method: str, path: str, payload: dict = None, status_code: int = 200):
    now = datetime.utcnow()
    doc = {
        "userUid": user_uid or "system",
        "method": method,
        "path": path,
        "payload": payload,
        "statusCode": status_code,
        "createdAt": now
    }
    _collection().insert_one(doc)

def list_audit_logs(limit=100):
    cursor = _collection().find({}).sort("createdAt", -1).limit(limit)
    return serialize_document(list(cursor))
