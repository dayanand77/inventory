from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from app.core.db import get_db
from app.models.schemas import serialize_document


def _departments_collection():
    return get_db().departments


def _inventory_collection():
    return get_db().inventory_items


def _department_allocations_collection():
    return get_db().department_allocations


def _department_transfers_collection():
    return get_db().department_transfers


def create_department(name: str, description: str = "", contact_info: str = ""):
    """Create a new department"""
    name = (name or "").strip()
    if not name:
        raise ValueError("Department name is required")
    
    dept_doc = {
        "name": name,
        "description": (description or "").strip(),
        "contact_info": (contact_info or "").strip(),
        "is_active": True,
        "createdAt": datetime.utcnow(),
    }
    
    try:
        result = _departments_collection().insert_one(dept_doc)
    except DuplicateKeyError as exc:
        raise ValueError("Department name already exists") from exc
    
    created = _departments_collection().find_one({"_id": result.inserted_id})
    return serialize_document(created)


def list_departments():
    """Get all active departments"""
    cursor = _departments_collection().find({"is_active": True}).sort("name", 1)
    return serialize_document(list(cursor))


def get_department(dept_id: str):
    """Get a specific department"""
    if not ObjectId.is_valid(dept_id):
        raise ValueError("Invalid department ID")
    
    dept = _departments_collection().find_one({"_id": ObjectId(dept_id)})
    if not dept:
        raise ValueError("Department not found")
    
    return serialize_document(dept)


def allocate_to_department(item_id: str, department_id: str, quantity: int, user: dict):
    """Allocate items to a specific department"""
    if not ObjectId.is_valid(item_id):
        raise ValueError("Invalid item ID")
    if not ObjectId.is_valid(department_id):
        raise ValueError("Invalid department ID")
    
    if quantity <= 0:
        raise ValueError("Allocation quantity must be greater than zero")
    
    item_obj_id = ObjectId(item_id)
    dept_obj_id = ObjectId(department_id)
    
    item = _inventory_collection().find_one({"_id": item_obj_id})
    if not item:
        raise ValueError("Item not found")
    
    dept = _departments_collection().find_one({"_id": dept_obj_id})
    if not dept:
        raise ValueError("Department not found")
    
    available = item.get("availableQuantity", 0)
    if quantity > available:
        raise ValueError(f"Cannot allocate {quantity} units. Only {available} units available")
    
    now = datetime.utcnow()
    
    allocation_doc = {
        "itemId": item_obj_id,
        "departmentId": dept_obj_id,
        "departmentName": dept.get("name"),
        "itemCode": item.get("itemCode"),
        "itemName": item.get("name"),
        "allocatedQuantity": quantity,
        "usedQuantity": 0,
        "status": "active",  # active, closed, cancelled
        "allocationDate": now,
        "allocatedBy": user.get("uid"),
    }
    
    result = _department_allocations_collection().insert_one(allocation_doc)
    
    # Update inventory
    new_available = available - quantity
    _inventory_collection().update_one(
        {"_id": item_obj_id},
        {
            "$set": {
                "availableQuantity": new_available,
                "updatedAt": now,
                "updatedBy": user.get("uid"),
                "isLowStock": new_available <= item.get("minimumThreshold", 0)
            }
        }
    )
    
    allocation = _department_allocations_collection().find_one({"_id": result.inserted_id})
    return serialize_document(allocation)


def get_department_allocations(department_id: str = None, item_id: str = None):
    """Get department allocations with optional filtering"""
    query = {"status": "active"}
    
    if department_id:
        if not ObjectId.is_valid(department_id):
            raise ValueError("Invalid department ID")
        query["departmentId"] = ObjectId(department_id)
    
    if item_id:
        if not ObjectId.is_valid(item_id):
            raise ValueError("Invalid item ID")
        query["itemId"] = ObjectId(item_id)
    
    cursor = _department_allocations_collection().find(query).sort("allocationDate", -1)
    return serialize_document(list(cursor))


def record_department_usage(allocation_id: str, used_quantity: int, user: dict):
    """Record usage of allocated items by a department"""
    if not ObjectId.is_valid(allocation_id):
        raise ValueError("Invalid allocation ID")
    
    if used_quantity <= 0:
        raise ValueError("Used quantity must be greater than zero")
    
    allocation_obj_id = ObjectId(allocation_id)
    allocation = _department_allocations_collection().find_one({"_id": allocation_obj_id})
    if not allocation:
        raise ValueError("Allocation not found")
    
    allocated = allocation.get("allocatedQuantity", 0)
    already_used = allocation.get("usedQuantity", 0)
    remaining = allocated - already_used
    
    if used_quantity > remaining:
        raise ValueError(f"Cannot use {used_quantity} units. Only {remaining} units remaining in allocation")
    
    now = datetime.utcnow()
    
    transfer_doc = {
        "allocationId": allocation_obj_id,
        "itemId": allocation.get("itemId"),
        "departmentId": allocation.get("departmentId"),
        "usedQuantity": used_quantity,
        "recordedBy": user.get("uid"),
        "createdAt": now,
    }
    
    _department_transfers_collection().insert_one(transfer_doc)
    
    # Update allocation
    new_used = already_used + used_quantity
    _department_allocations_collection().update_one(
        {"_id": allocation_obj_id},
        {"$set": {"usedQuantity": new_used}}
    )
    
    return serialize_document(transfer_doc)


def get_department_consumption(department_id: str, start_date: str = None, end_date: str = None):
    """Get consumption history for a department"""
    if not ObjectId.is_valid(department_id):
        raise ValueError("Invalid department ID")
    
    query = {"departmentId": ObjectId(department_id)}
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query["createdAt"] = {"$gte": start}
        except ValueError:
            raise ValueError("Invalid start_date format")
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            if "createdAt" not in query:
                query["createdAt"] = {}
            query["createdAt"]["$lte"] = end
        except ValueError:
            raise ValueError("Invalid end_date format")
    
    cursor = _department_transfers_collection().find(query).sort("createdAt", -1)
    return serialize_document(list(cursor))


def get_department_summary(department_id: str):
    """Get allocation and consumption summary for a department"""
    if not ObjectId.is_valid(department_id):
        raise ValueError("Invalid department ID")
    
    dept_obj_id = ObjectId(department_id)
    
    # Get all allocations for this department
    allocations = list(_department_allocations_collection().find(
        {"departmentId": dept_obj_id}
    ))
    
    total_allocated = sum(a.get("allocatedQuantity", 0) for a in allocations)
    total_used = sum(a.get("usedQuantity", 0) for a in allocations)
    
    return {
        "departmentId": str(dept_obj_id),
        "totalAllocated": total_allocated,
        "totalUsed": total_used,
        "activeAllocations": len([a for a in allocations if a.get("status") == "active"]),
        "allocationDetails": serialize_document(allocations)
    }
