from datetime import datetime

from bson import ObjectId

from app.core.db import get_db
from app.models.schemas import serialize_document


LOW_STOCK_TYPE = "LOW_STOCK"


def _collection():
    return get_db().notifications


def generate_low_stock_notifications(limit=100):
    db = get_db()
    low_stock_items = list(db.inventory_items.find({"isLowStock": True}).limit(limit))
    created_notifications = []

    for item in low_stock_items:
        existing = _collection().find_one(
            {
                "type": LOW_STOCK_TYPE,
                "itemId": str(item["_id"]),
                "isRead": False,
            }
        )
        if existing:
            continue

        message = (
            f"Low stock alert: {item.get('name')} ({item.get('itemCode')}) has "
            f"{item.get('availableQuantity', 0)} units available."
        )
        notification_doc = {
            "type": LOW_STOCK_TYPE,
            "itemId": str(item["_id"]),
            "itemCode": item.get("itemCode"),
            "message": message,
            "isRead": False,
            "createdAt": datetime.utcnow(),
        }
        result = _collection().insert_one(notification_doc)
        created_notifications.append(_collection().find_one({"_id": result.inserted_id}))

    return serialize_document(created_notifications)


def list_notifications(limit=100):
    notifications = list(_collection().find({}).sort("createdAt", -1).limit(limit))
    return serialize_document(notifications)


def mark_notification_as_read(notification_id: str):
    if not ObjectId.is_valid(notification_id):
        raise ValueError("Invalid notification ID")

    _collection().update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"isRead": True, "readAt": datetime.utcnow()}},
    )
    notification = _collection().find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise ValueError("Notification not found")

    return serialize_document(notification)
