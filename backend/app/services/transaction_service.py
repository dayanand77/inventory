from datetime import datetime

from bson import ObjectId

from app.core.db import get_db
from app.models.schemas import serialize_document
from app.services.inventory_service import issue_item_stock, return_item_stock


def _collection():
    return get_db().transactions


def _to_object_id(transaction_id: str) -> ObjectId:
    if not ObjectId.is_valid(transaction_id):
        raise ValueError("Invalid transaction ID")
    return ObjectId(transaction_id)


def _to_int(value, field_name: str):
    try:
        int_value = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} must be a valid integer") from exc

    if int_value <= 0:
        raise ValueError(f"{field_name} must be greater than zero")

    return int_value


def _insert_transaction(doc: dict):
    doc["createdAt"] = datetime.utcnow()
    result = _collection().insert_one(doc)
    return serialize_document(_collection().find_one({"_id": result.inserted_id}))


def list_transactions(current_user: dict, transaction_type=None, status=None):
    query = {}

    if transaction_type:
        query["type"] = transaction_type.upper()

    if status:
        query["status"] = status.upper()

    if current_user.get("role") == "STAFF":
        query["$or"] = [
            {"requesterUid": current_user.get("uid")},
            {"processedBy": current_user.get("uid")},
        ]

    transactions = list(_collection().find(query).sort("createdAt", -1).limit(300))
    return serialize_document(transactions)


def create_request(payload: dict, current_user: dict):
    item_id = payload.get("itemId")
    quantity = _to_int(payload.get("quantity"), "quantity")

    if not item_id:
        raise ValueError("itemId is required")

    request_doc = {
        "itemId": item_id,
        "type": "REQUEST",
        "status": "PENDING",
        "quantity": quantity,
        "requesterUid": current_user.get("uid"),
        "requesterName": current_user.get("displayName") or current_user.get("email"),
        "department": payload.get("department", current_user.get("department", "")),
        "notes": payload.get("notes", ""),
        "processedBy": None,
    }

    return _insert_transaction(request_doc)


def issue_item(payload: dict, current_user: dict):
    item_id = payload.get("itemId")
    quantity = _to_int(payload.get("quantity"), "quantity")

    if not item_id:
        raise ValueError("itemId is required")

    updated_item = issue_item_stock(item_id, quantity, current_user, payload)

    transaction_doc = {
        "itemId": item_id,
        "type": "ISSUE",
        "status": "COMPLETED",
        "quantity": quantity,
        "requesterUid": payload.get("requesterUid", ""),
        "requesterName": payload.get("recipientName", ""),
        "department": payload.get("department", ""),
        "notes": payload.get("notes", ""),
        "processedBy": current_user.get("uid"),
    }

    transaction = _insert_transaction(transaction_doc)
    return {"item": updated_item, "transaction": transaction}


def return_item(payload: dict, current_user: dict):
    item_id = payload.get("itemId")
    quantity = _to_int(payload.get("quantity"), "quantity")

    if not item_id:
        raise ValueError("itemId is required")

    updated_item = return_item_stock(item_id, quantity, current_user, payload)

    transaction_doc = {
        "itemId": item_id,
        "type": "RETURN",
        "status": "COMPLETED",
        "quantity": quantity,
        "requesterUid": payload.get("requesterUid", ""),
        "requesterName": payload.get("recipientName", ""),
        "department": payload.get("department", ""),
        "notes": payload.get("notes", ""),
        "processedBy": current_user.get("uid"),
    }

    transaction = _insert_transaction(transaction_doc)
    return {"item": updated_item, "transaction": transaction}


def approve_request(request_id: str, current_user: dict):
    object_id = _to_object_id(request_id)
    existing = _collection().find_one({"_id": object_id, "type": "REQUEST", "status": "PENDING"})
    if not existing:
        raise ValueError("Pending request not found")

    payload = {
        "itemId": existing.get("itemId"),
        "quantity": existing.get("quantity"),
        "requesterUid": existing.get("requesterUid"),
        "recipientName": existing.get("requesterName"),
        "department": existing.get("department", ""),
        "notes": existing.get("notes", ""),
    }

    issued = issue_item(payload, current_user)

    _collection().update_one(
        {"_id": object_id},
        {
            "$set": {
                "status": "APPROVED",
                "approvedAt": datetime.utcnow(),
                "processedBy": current_user.get("uid"),
                "linkedTransactionId": issued["transaction"]["_id"],
            }
        },
    )

    approved_request = _collection().find_one({"_id": object_id})
    return {
        "request": serialize_document(approved_request),
        "issued": issued,
    }
