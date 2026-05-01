from app.core.db import get_db
from app import create_app

app = create_app()
with app.app_context():
    db = get_db()
    users = list(db.users.find({}))
    for u in users:
        print(f"UID: {u.get('uid')}, Email: {u.get('email')}, Role: {u.get('role')}")
