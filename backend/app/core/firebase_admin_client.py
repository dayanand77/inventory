import json

import firebase_admin
from firebase_admin import credentials
from flask import current_app


_firebase_initialized = False


def initialize_firebase_admin():
    global _firebase_initialized

    if _firebase_initialized:
        return

    service_account_json = current_app.config.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    project_id = current_app.config.get("FIREBASE_PROJECT_ID", "").strip()

    options = {"projectId": project_id} if project_id else None

    if service_account_json:
        cred = credentials.Certificate(json.loads(service_account_json))
        firebase_admin.initialize_app(cred, options)
    else:
        # Falls back to GOOGLE_APPLICATION_CREDENTIALS / cloud default credentials.
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, options)

    _firebase_initialized = True
