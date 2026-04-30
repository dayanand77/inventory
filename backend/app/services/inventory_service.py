from datetime import datetime, timedelta

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.core.db import get_db
from app.models.schemas import serialize_document


def _collection():
    return get_db().inventory_items


def _to_object_id(item_id: str) -> ObjectId:
    if not ObjectId.is_valid(item_id):
        raise ValueError("Invalid item ID")
    return ObjectId(item_id)


def _to_positive_int(value, field_name: str, allow_zero: bool = False) -> int:
    try:
        int_value = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field_name} must be a valid integer") from exc

    if allow_zero and int_value < 0:
        raise ValueError(f"{field_name} cannot be negative")
    if not allow_zero and int_value <= 0:
        raise ValueError(f"{field_name} must be greater than zero")

    return int_value


def _is_low_stock(item: dict) -> bool:
    return item.get("availableQuantity", 0) <= item.get("minimumThreshold", 0)


def list_inventory(search=None, category=None, location=None, low_stock=False):
    query = {}

    if search:
        regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"name": regex},
            {"itemCode": regex},
            {"category": regex},
            {"location": regex},
        ]

    if category:
        query["category"] = category

    if location:
        query["location"] = location

    if low_stock:
        query["isLowStock"] = True

    cursor = _collection().find(query).sort("updatedAt", -1)
    return serialize_document(list(cursor))


def list_expiring_inventory(days: int = 30):
    cutoff_date = (datetime.utcnow() + timedelta(days=days)).isoformat()
    # expiryDate is stored as string YYYY-MM-DD
    # We want items where expiryDate exists and is <= cutoff_date string (lexicographical compare works for iso dates)
    query = {
        "expiryDate": {
            "$exists": True,
            "$ne": "",
            "$ne": None,
            "$lte": cutoff_date[:10]  # Just YYYY-MM-DD
        }
    }
    cursor = _collection().find(query).sort("expiryDate", 1)
    return serialize_document(list(cursor))


def get_item_by_id(item_id: str):
    item = _collection().find_one({"_id": _to_object_id(item_id)})
    if not item:
        raise ValueError("Item not found")
    return serialize_document(item)


def get_item_by_code(item_code: str):
    item = _collection().find_one({"itemCode": item_code})
    if not item:
        raise ValueError("Item not found")
    return serialize_document(item)


def create_item(payload: dict, user: dict, default_threshold: int):
    name = (payload.get("name") or "").strip()
    item_code = (payload.get("itemCode") or "").strip().upper()
    category = (payload.get("category") or "").strip()
    location = (payload.get("location") or "").strip()

    if not all([name, item_code, category, location]):
        raise ValueError("name, itemCode, category, and location are required")

    quantity = _to_positive_int(payload.get("quantity"), "quantity")
    minimum_threshold = _to_positive_int(
        payload.get("minimumThreshold", default_threshold),
        "minimumThreshold",
        allow_zero=True,
    )

    now = datetime.utcnow()

    item_doc = {
        "name": name,
        "itemCode": item_code,
        "category": category,
        "location": location,
        "unit": (payload.get("unit") or "unit").strip(),
        "description": (payload.get("description") or "").strip(),
        "manufacturer": (payload.get("manufacturer") or "").strip(),
        "supplierId": payload.get("supplierId"),
        "expiryDate": payload.get("expiryDate"),
        "barcode": (payload.get("barcode") or item_code).strip(),
        "lotNumber": (payload.get("lotNumber") or "").strip(),
        "batchNumber": (payload.get("batchNumber") or "").strip(),
        "department": payload.get("department"),
        "complianceStandards": payload.get("complianceStandards", []),
        "totalQuantity": quantity,
        "availableQuantity": quantity,
        "issuedQuantity": 0,
        "minimumThreshold": minimum_threshold,
        "isLowStock": quantity <= minimum_threshold,
        "usageHistory": [],
        "createdAt": now,
        "updatedAt": now,
        "updatedBy": user.get("uid"),
    }

    try:
        result = _collection().insert_one(item_doc)
    except DuplicateKeyError as exc:
        raise ValueError("Item code already exists") from exc

    created = _collection().find_one({"_id": result.inserted_id})
    return serialize_document(created)


def update_item(item_id: str, payload: dict, user: dict):
    object_id = _to_object_id(item_id)
    existing = _collection().find_one({"_id": object_id})
    if not existing:
        raise ValueError("Item not found")

    issued_quantity = existing.get("issuedQuantity", 0)
    total_quantity = existing.get("totalQuantity", 0)
    new_total_quantity = total_quantity

    if "totalQuantity" in payload:
        new_total_quantity = _to_positive_int(payload.get("totalQuantity"), "totalQuantity")
    elif "quantity" in payload:
        new_total_quantity = _to_positive_int(payload.get("quantity"), "quantity")

    if new_total_quantity < issued_quantity:
        raise ValueError("totalQuantity cannot be less than issuedQuantity")

    update_data = {
        "name": payload.get("name", existing.get("name")),
        "category": payload.get("category", existing.get("category")),
        "location": payload.get("location", existing.get("location")),
        "unit": payload.get("unit", existing.get("unit", "unit")),
        "description": payload.get("description", existing.get("description", "")),
        "manufacturer": payload.get("manufacturer", existing.get("manufacturer", "")),
        "supplierId": payload.get("supplierId", existing.get("supplierId")),
        "expiryDate": payload.get("expiryDate", existing.get("expiryDate")),
        "barcode": payload.get("barcode", existing.get("barcode", existing.get("itemCode"))),
        "lotNumber": payload.get("lotNumber", existing.get("lotNumber", "")),
        "batchNumber": payload.get("batchNumber", existing.get("batchNumber", "")),
        "department": payload.get("department", existing.get("department")),
        "complianceStandards": payload.get("complianceStandards", existing.get("complianceStandards", [])),
        "totalQuantity": new_total_quantity,
        "availableQuantity": new_total_quantity - issued_quantity,
        "minimumThreshold": _to_positive_int(
            payload.get("minimumThreshold", existing.get("minimumThreshold", 0)),
            "minimumThreshold",
            allow_zero=True,
        ),
        "updatedAt": datetime.utcnow(),
        "updatedBy": user.get("uid"),
    }
    update_data["isLowStock"] = update_data["availableQuantity"] <= update_data["minimumThreshold"]

    if "itemCode" in payload:
        update_data["itemCode"] = (payload.get("itemCode") or "").strip().upper()

    try:
        updated = _collection().find_one_and_update(
            {"_id": object_id},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER,
        )
    except DuplicateKeyError as exc:
        raise ValueError("Item code already exists") from exc

    return serialize_document(updated)


def delete_item(item_id: str):
    object_id = _to_object_id(item_id)
    existing = _collection().find_one({"_id": object_id})
    if not existing:
        raise ValueError("Item not found")

    if existing.get("issuedQuantity", 0) > 0:
        raise ValueError("Cannot delete item while units are issued")

    _collection().delete_one({"_id": object_id})


def issue_item_stock(item_id: str, quantity: int, user: dict, extra_meta=None):
    object_id = _to_object_id(item_id)
    quantity = _to_positive_int(quantity, "quantity")
    extra_meta = extra_meta or {}

    updated = _collection().find_one_and_update(
        {"_id": object_id, "availableQuantity": {"$gte": quantity}},
        {
            "$inc": {"availableQuantity": -quantity, "issuedQuantity": quantity},
            "$set": {"updatedAt": datetime.utcnow(), "updatedBy": user.get("uid")},
            "$push": {
                "usageHistory": {
                    "$each": [
                        {
                            "type": "ISSUE",
                            "quantity": quantity,
                            "note": extra_meta.get("notes", ""),
                            "createdAt": datetime.utcnow(),
                            "processedBy": user.get("uid"),
                        }
                    ],
                    "$slice": -50,
                }
            },
        },
        return_document=ReturnDocument.AFTER,
    )

    if not updated:
        raise ValueError("Insufficient stock or invalid item")

    updated["isLowStock"] = _is_low_stock(updated)
    _collection().update_one(
        {"_id": object_id}, {"$set": {"isLowStock": updated["isLowStock"]}}
    )

    return serialize_document(updated)


def return_item_stock(item_id: str, quantity: int, user: dict, extra_meta=None):
    object_id = _to_object_id(item_id)
    quantity = _to_positive_int(quantity, "quantity")
    extra_meta = extra_meta or {}

    updated = _collection().find_one_and_update(
        {"_id": object_id, "issuedQuantity": {"$gte": quantity}},
        {
            "$inc": {"availableQuantity": quantity, "issuedQuantity": -quantity},
            "$set": {"updatedAt": datetime.utcnow(), "updatedBy": user.get("uid")},
            "$push": {
                "usageHistory": {
                    "$each": [
                        {
                            "type": "RETURN",
                            "quantity": quantity,
                            "note": extra_meta.get("notes", ""),
                            "createdAt": datetime.utcnow(),
                            "processedBy": user.get("uid"),
                        }
                    ],
                    "$slice": -50,
                }
            },
        },
        return_document=ReturnDocument.AFTER,
    )

    if not updated:
        raise ValueError("Return quantity exceeds issued stock or invalid item")

    updated["isLowStock"] = _is_low_stock(updated)
    _collection().update_one(
        {"_id": object_id}, {"$set": {"isLowStock": updated["isLowStock"]}}
    )

    return serialize_document(updated)


def restock_item_stock(item_id: str, quantity: int, user: dict, extra_meta=None):
    object_id = _to_object_id(item_id)
    quantity = _to_positive_int(quantity, "quantity")
    extra_meta = extra_meta or {}

    updated = _collection().find_one_and_update(
        {"_id": object_id},
        {
            "$inc": {"availableQuantity": quantity, "totalQuantity": quantity},
            "$set": {"updatedAt": datetime.utcnow(), "updatedBy": user.get("uid")},
            "$push": {
                "usageHistory": {
                    "$each": [
                        {
                            "type": "RESTOCK",
                            "quantity": quantity,
                            "note": extra_meta.get("notes", ""),
                            "createdAt": datetime.utcnow(),
                            "processedBy": user.get("uid"),
                        }
                    ],
                    "$slice": -50,
                }
            },
        },
        return_document=ReturnDocument.AFTER,
    )

    if not updated:
        raise ValueError("Invalid item")

    updated["isLowStock"] = _is_low_stock(updated)
    _collection().update_one(
        {"_id": object_id}, {"$set": {"isLowStock": updated["isLowStock"]}}
    )

    return serialize_document(updated)
