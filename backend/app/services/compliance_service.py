from datetime import datetime
from bson import ObjectId
from app.core.db import get_db
from app.models.schemas import serialize_document


COMPLIANCE_STANDARDS = [
    "ISO 13485",      # Medical devices quality management
    "ISO 14644",      # Cleanrooms classification
    "FDA",            # Food and Drug Administration
    "WHO",            # World Health Organization
    "CE",             # Conformité Européenne
    "GMP",            # Good Manufacturing Practice
    "HIPAA",          # Health Insurance Portability and Accountability
]


def _compliance_collection():
    return get_db().compliance_records


def _inventory_collection():
    return get_db().inventory_items


def get_compliance_standards():
    """Get list of supported compliance standards"""
    return COMPLIANCE_STANDARDS


def add_compliance_record(item_id: str, standards: list, details: str = "", user: dict = None):
    """Add compliance information to an item"""
    if not ObjectId.is_valid(item_id):
        raise ValueError("Invalid item ID")
    
    item_obj_id = ObjectId(item_id)
    item = _inventory_collection().find_one({"_id": item_obj_id})
    if not item:
        raise ValueError("Item not found")
    
    # Validate standards
    invalid_standards = [s for s in standards if s not in COMPLIANCE_STANDARDS]
    if invalid_standards:
        raise ValueError(f"Invalid compliance standards: {', '.join(invalid_standards)}")
    
    now = datetime.utcnow()
    
    compliance_doc = {
        "itemId": item_obj_id,
        "itemCode": item.get("itemCode"),
        "itemName": item.get("name"),
        "standards": standards,
        "details": (details or "").strip(),
        "recordedBy": user.get("uid") if user else None,
        "createdAt": now,
    }
    
    result = _compliance_collection().insert_one(compliance_doc)
    
    # Update inventory with compliance standards
    _inventory_collection().update_one(
        {"_id": item_obj_id},
        {
            "$set": {
                "complianceStandards": standards,
                "updatedAt": now,
            }
        }
    )
    
    compliance = _compliance_collection().find_one({"_id": result.inserted_id})
    return serialize_document(compliance)


def get_item_compliance(item_id: str):
    """Get compliance records for an item"""
    if not ObjectId.is_valid(item_id):
        raise ValueError("Invalid item ID")
    
    cursor = _compliance_collection().find(
        {"itemId": ObjectId(item_id)}
    ).sort("createdAt", -1)
    
    return serialize_document(list(cursor))


def get_compliance_report(standard: str = None):
    """Get items by compliance standard"""
    query = {}
    
    if standard:
        if standard not in COMPLIANCE_STANDARDS:
            raise ValueError(f"Invalid compliance standard: {standard}")
        # For items, check if they have the standard
        items = list(_inventory_collection().find(
            {"complianceStandards": {"$in": [standard]}}
        ))
        return serialize_document(items)
    else:
        # Return all items with compliance info
        items = list(_inventory_collection().find(
            {"complianceStandards": {"$exists": True, "$ne": []}}
        ))
        return serialize_document(items)


def get_non_compliant_items():
    """Get items without compliance standards"""
    cursor = _inventory_collection().find({
        "$or": [
            {"complianceStandards": {"$exists": False}},
            {"complianceStandards": []}
        ]
    })
    return serialize_document(list(cursor))


def get_compliance_audit_log(start_date: str = None, end_date: str = None):
    """Get audit log of compliance records created"""
    query = {}
    
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
    
    cursor = _compliance_collection().find(query).sort("createdAt", -1)
    return serialize_document(list(cursor))


def get_compliance_summary():
    """Get summary of compliance across inventory"""
    total_items = _inventory_collection().count_documents({})
    compliant_items = _inventory_collection().count_documents({
        "complianceStandards": {"$exists": True, "$ne": []}
    })
    
    # Group by standards
    pipeline = [
        {
            "$match": {
                "complianceStandards": {"$exists": True, "$ne": []}
            }
        },
        {
            "$unwind": "$complianceStandards"
        },
        {
            "$group": {
                "_id": "$complianceStandards",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    standards_breakdown = list(_inventory_collection().aggregate(pipeline))
    
    return {
        "totalItems": total_items,
        "compliantItems": compliant_items,
        "compliancePercentage": round((compliant_items / total_items * 100) if total_items > 0 else 0, 2),
        "standardsBreakdown": serialize_document(standards_breakdown)
    }


def generate_compliance_report(report_type: str = "summary"):
    """Generate various compliance reports"""
    if report_type == "summary":
        return get_compliance_summary()
    elif report_type == "non_compliant":
        return {
            "report_type": "non_compliant_items",
            "items": get_non_compliant_items()
        }
    elif report_type == "by_standard":
        summary = get_compliance_summary()
        all_reports = {}
        for standard in COMPLIANCE_STANDARDS:
            all_reports[standard] = get_compliance_report(standard)
        return {
            "report_type": "by_standard",
            "summary": summary,
            "detailed": all_reports
        }
    else:
        raise ValueError("Invalid report_type. Use 'summary', 'non_compliant', or 'by_standard'")
