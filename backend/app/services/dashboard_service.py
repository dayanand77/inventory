from datetime import datetime, timedelta

from app.core.db import get_db
from app.models.schemas import serialize_document


def get_metrics():
    db = get_db()
    inventory = list(db.inventory_items.find({}))

    total_items = len(inventory)
    total_units = sum(item.get("totalQuantity", 0) for item in inventory)
    available_units = sum(item.get("availableQuantity", 0) for item in inventory)
    issued_units = sum(item.get("issuedQuantity", 0) for item in inventory)
    low_stock_count = sum(1 for item in inventory if item.get("isLowStock"))

    return {
        "totalItems": total_items,
        "totalUnits": total_units,
        "availableUnits": available_units,
        "issuedUnits": issued_units,
        "lowStockCount": low_stock_count,
    }


def get_category_breakdown():
    db = get_db()
    pipeline = [
        {
            "$group": {
                "_id": "$category",
                "totalUnits": {"$sum": "$totalQuantity"},
                "availableUnits": {"$sum": "$availableQuantity"},
                "issuedUnits": {"$sum": "$issuedQuantity"},
            }
        },
        {"$sort": {"totalUnits": -1}},
    ]

    rows = list(db.inventory_items.aggregate(pipeline))
    for row in rows:
        row["category"] = row.pop("_id")
    return serialize_document(rows)


def get_monthly_usage(months=6):
    db = get_db()
    now = datetime.utcnow()
    start_date = now - timedelta(days=31 * months)

    pipeline = [
        {
            "$match": {
                "type": "ISSUE",
                "status": "COMPLETED",
                "createdAt": {"$gte": start_date},
            }
        },
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$createdAt"},
                    "month": {"$month": "$createdAt"},
                },
                "quantityIssued": {"$sum": "$quantity"},
                "transactions": {"$sum": 1},
            }
        },
        {"$sort": {"_id.year": 1, "_id.month": 1}},
    ]

    rows = list(db.transactions.aggregate(pipeline))
    result = []
    for row in rows:
        key = row["_id"]
        result.append(
            {
                "period": f"{key['year']}-{str(key['month']).zfill(2)}",
                "quantityIssued": row["quantityIssued"],
                "transactions": row["transactions"],
            }
        )

    return result


def get_low_stock_items():
    db = get_db()
    items = list(
        db.inventory_items.find({"isLowStock": True}).sort("availableQuantity", 1).limit(50)
    )
    return serialize_document(items)
