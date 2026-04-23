import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
uri = os.environ.get("MONGODB_URI")
db_name = os.environ.get("MONGODB_DB_NAME", "inventory")
client = MongoClient(uri)
db = client[db_name]

pipeline = [
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
            "name": 1,
            "stringId": 1,
            "suppliedItems_count": {"$size": "$suppliedItems"}
        }
    }
]

res = list(db.suppliers.aggregate(pipeline))
print("Result:")
for r in res:
    print(r)
