from app.core.db import get_db
from app import create_app

app = create_app()
with app.app_context():
    db = get_db()
    uid = "nXpYQVoZkePjxSVIEgqgKhXE7hI3"
    db.users.update_one({"uid": uid}, {"$set": {"role": "ADMIN"}})
    print(f"User {uid} promoted to ADMIN")
