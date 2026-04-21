from flask import current_app
from pymongo import ASCENDING, DESCENDING, MongoClient

_mongo_client = None
_database = None


def init_db(app):
    global _mongo_client
    global _database

    _mongo_client = MongoClient(app.config["MONGODB_URI"])
    _database = _mongo_client[app.config["MONGODB_DB_NAME"]]

    _database.users.create_index([("uid", ASCENDING)], unique=True)
    _database.inventory_items.create_index([("itemCode", ASCENDING)], unique=True)
    _database.inventory_items.create_index([("name", ASCENDING)])
    _database.inventory_items.create_index([("category", ASCENDING)])
    _database.inventory_items.create_index([("location", ASCENDING)])
    _database.inventory_items.create_index([("isLowStock", ASCENDING)])
    _database.transactions.create_index([("itemId", ASCENDING), ("createdAt", DESCENDING)])
    _database.transactions.create_index([("requesterUid", ASCENDING), ("createdAt", DESCENDING)])
    _database.notifications.create_index([("isRead", ASCENDING), ("createdAt", DESCENDING)])

    app.logger.info("MongoDB initialized")


def get_db():
    if _database is None:
        current_app.logger.error("Database has not been initialized")
        raise RuntimeError("Database has not been initialized")
    return _database
