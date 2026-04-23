from datetime import datetime

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.core.db import get_db
from app.models.schemas import serialize_document


def _collection():
    return get_db().suppliers


def _to_object_id(item_id: str) -> ObjectId:
    if not ObjectId.is_valid(item_id):
        raise ValueError("Invalid supplier ID")
    return ObjectId(item_id)


def list_suppliers(search=None):
    query = {}
    if search:
        regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"name": regex},
            {"contactEmail": regex},
            {"contactPhone": regex},
        ]

    pipeline = [
        {"$match": query},
        {
            "$addFields": {
                "stringId": {"$toString": "$_id"}
            }
        },
        {
            "$lookup": {
                "from": "inventory_items",
                "localField": "stringId",
                "foreignField": "supplierId",
                "as": "suppliedItems"
            }
        },
        {
            "$project": {
                "stringId": 0
            }
        },
        {"$sort": {"name": 1}}
    ]
    cursor = _collection().aggregate(pipeline)
    return serialize_document(list(cursor))


def get_supplier_by_id(supplier_id: str):
    supplier = _collection().find_one({"_id": _to_object_id(supplier_id)})
    if not supplier:
        raise ValueError("Supplier not found")
    return serialize_document(supplier)


def create_supplier(payload: dict, user: dict):
    name = (payload.get("name") or "").strip()
    
    if not name:
        raise ValueError("Supplier name is required")

    now = datetime.utcnow()

    supplier_doc = {
        "name": name,
        "contactName": (payload.get("contactName") or "").strip(),
        "contactEmail": (payload.get("contactEmail") or "").strip(),
        "contactPhone": (payload.get("contactPhone") or "").strip(),
        "address": (payload.get("address") or "").strip(),
        "rating": payload.get("rating", 0),
        "notes": (payload.get("notes") or "").strip(),
        "createdAt": now,
        "updatedAt": now,
        "updatedBy": user.get("uid"),
    }

    try:
        # Assuming name must be unique
        result = _collection().insert_one(supplier_doc)
    except DuplicateKeyError as exc:
        raise ValueError("Supplier with this name already exists") from exc

    created = _collection().find_one({"_id": result.inserted_id})
    return serialize_document(created)


def update_supplier(supplier_id: str, payload: dict, user: dict):
    object_id = _to_object_id(supplier_id)
    existing = _collection().find_one({"_id": object_id})
    if not existing:
        raise ValueError("Supplier not found")

    update_data = {
        "name": payload.get("name", existing.get("name")),
        "contactName": payload.get("contactName", existing.get("contactName", "")),
        "contactEmail": payload.get("contactEmail", existing.get("contactEmail", "")),
        "contactPhone": payload.get("contactPhone", existing.get("contactPhone", "")),
        "address": payload.get("address", existing.get("address", "")),
        "rating": payload.get("rating", existing.get("rating", 0)),
        "notes": payload.get("notes", existing.get("notes", "")),
        "updatedAt": datetime.utcnow(),
        "updatedBy": user.get("uid"),
    }

    try:
        from pymongo import ReturnDocument
        updated = _collection().find_one_and_update(
            {"_id": object_id},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER,
        )
    except DuplicateKeyError as exc:
        raise ValueError("Supplier with this name already exists") from exc

    return serialize_document(updated)


def delete_supplier(supplier_id: str):
    object_id = _to_object_id(supplier_id)
    existing = _collection().find_one({"_id": object_id})
    if not existing:
        raise ValueError("Supplier not found")

    # Check if there are items linked to this supplier
    items_count = get_db().inventory_items.count_documents({"supplierId": str(object_id)})
    if items_count > 0:
        raise ValueError("Cannot delete supplier while items are linked to it")

    _collection().delete_one({"_id": object_id})
