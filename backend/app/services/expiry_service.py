from datetime import datetime, timedelta
from bson import ObjectId
from app.core.db import get_db
from app.models.schemas import serialize_document


def _wastage_collection():
    return get_db().wastage_records


def _inventory_collection():
    return get_db().inventory_items


def get_expiring_items(days: int = 30):
    """Get all items expiring within the specified number of days"""
    today = datetime.utcnow().date()
    cutoff_date = (today + timedelta(days=days)).isoformat()
    
    query = {
        "expiryDate": {
            "$exists": True,
            "$ne": "",
            "$ne": None,
            "$lte": cutoff_date
        }
    }
    cursor = _inventory_collection().find(query).sort("expiryDate", 1)
    return serialize_document(list(cursor))


def get_expired_items():
    """Get all items that have already expired"""
    today = datetime.utcnow().date().isoformat()
    
    query = {
        "expiryDate": {
            "$exists": True,
            "$ne": "",
            "$ne": None,
            "$lt": today
        }
    }
    cursor = _inventory_collection().find(query).sort("expiryDate", 1)
    return serialize_document(list(cursor))


def record_wastage(item_id: str, quantity: int, reason: str, user: dict):
    """Record wastage of an item (e.g., expired, damaged)"""
    if not ObjectId.is_valid(item_id):
        raise ValueError("Invalid item ID")
    
    if quantity <= 0:
        raise ValueError("Wastage quantity must be greater than zero")
    
    object_id = ObjectId(item_id)
    item = _inventory_collection().find_one({"_id": object_id})
    if not item:
        raise ValueError("Item not found")
    
    available = item.get("availableQuantity", 0)
    if quantity > available:
        raise ValueError(f"Cannot waste {quantity} units. Only {available} units available")
    
    now = datetime.utcnow()
    
    wastage_record = {
        "itemId": object_id,
        "itemCode": item.get("itemCode"),
        "itemName": item.get("name"),
        "quantity": quantity,
        "reason": reason,
        "lot_number": item.get("lotNumber"),
        "expiryDate": item.get("expiryDate"),
        "recordedBy": user.get("uid"),
        "createdAt": now,
    }
    
    _wastage_collection().insert_one(wastage_record)
    
    # Update inventory
    new_available = available - quantity
    _inventory_collection().update_one(
        {"_id": object_id},
        {
            "$set": {
                "availableQuantity": new_available,
                "updatedAt": now,
                "updatedBy": user.get("uid"),
                "isLowStock": new_available <= item.get("minimumThreshold", 0)
            }
        }
    )
    
    return serialize_document(wastage_record)


def get_wastage_records(item_id: str = None, start_date: str = None, end_date: str = None):
    """Get wastage records with optional filtering"""
    query = {}
    
    if item_id:
        if not ObjectId.is_valid(item_id):
            raise ValueError("Invalid item ID")
        query["itemId"] = ObjectId(item_id)
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query["createdAt"] = {"$gte": start}
        except ValueError:
            raise ValueError("Invalid start_date format. Use ISO format (YYYY-MM-DD)")
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            if "createdAt" not in query:
                query["createdAt"] = {}
            query["createdAt"]["$lte"] = end
        except ValueError:
            raise ValueError("Invalid end_date format. Use ISO format (YYYY-MM-DD)")
    
    cursor = _wastage_collection().find(query).sort("createdAt", -1)
    return serialize_document(list(cursor))


def get_wastage_summary():
    """Get summary of wastage by reason"""
    pipeline = [
        {
            "$group": {
                "_id": "$reason",
                "totalQuantity": {"$sum": "$quantity"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"totalQuantity": -1}}
    ]
    
    results = list(_wastage_collection().aggregate(pipeline))
    return serialize_document(results)


def get_expiry_alerts_summary():
    """Get summary of items by expiry status"""
    today = datetime.utcnow().date().isoformat()
    
    # Expired items
    expired = _inventory_collection().count_documents({
        "expiryDate": {"$exists": True, "$lt": today}
    })
    
    # Expiring within 7 days
    week_from_now = (datetime.utcnow().date() + timedelta(days=7)).isoformat()
    expiring_soon = _inventory_collection().count_documents({
        "expiryDate": {
            "$exists": True,
            "$gte": today,
            "$lte": week_from_now
        }
    })
    
    # Expiring within 30 days
    month_from_now = (datetime.utcnow().date() + timedelta(days=30)).isoformat()
    expiring_month = _inventory_collection().count_documents({
        "expiryDate": {
            "$exists": True,
            "$gt": week_from_now,
            "$lte": month_from_now
        }
    })
    
    return {
        "expired": expired,
        "expiringWithin7Days": expiring_soon,
        "expiringWithin30Days": expiring_month
    }
