import os


class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "replace-this-key")
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "medical_college_inventory")
    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_SERVICE_ACCOUNT_JSON = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    LOW_STOCK_DEFAULT_THRESHOLD = int(os.getenv("LOW_STOCK_DEFAULT_THRESHOLD", "10"))
