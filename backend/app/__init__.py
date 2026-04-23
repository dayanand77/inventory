from dotenv import load_dotenv

load_dotenv(override=True)

from flask import Flask, jsonify
from flask_cors import CORS

from app.api.auth_routes import auth_bp
from app.api.dashboard_routes import dashboard_bp
from app.api.inventory_routes import inventory_bp
from app.api.notification_routes import notification_bp
from app.api.supplier_routes import supplier_bp
from app.api.audit_routes import audit_bp
from app.api.transaction_routes import transaction_bp
from app.core.config import Config
from app.core.db import init_db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    init_db(app)

    @app.get("/")
    def root_index():
        return jsonify(
            {
                "message": "Medical College Inventory API",
                "health": "/health",
                "apiBase": "/api",
                "docsHint": "Use /api/* endpoints for app features",
            }
        ), 200

    @app.get("/api")
    def api_index():
        return jsonify(
            {
                "message": "API is running",
                "endpoints": {
                    "auth": "/api/auth/*",
                    "inventory": "/api/inventory/*",
                    "transactions": "/api/transactions/*",
                    "dashboard": "/api/dashboard/*",
                    "notifications": "/api/notifications/*",
                },
            }
        ), 200

    @app.get("/health")
    def health_check():
        return jsonify({"status": "ok"}), 200

    app.register_blueprint(auth_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(supplier_bp)
    app.register_blueprint(audit_bp)

    @app.after_request
    def log_mutating_requests(response):
        from flask import request, g
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            # Avoid logging login/auth syncs or read-only if we don't want to
            user_uid = None
            if hasattr(g, "current_user") and g.current_user:
                user_uid = g.current_user.get("uid")
            
            payload = request.get_json(silent=True) if request.is_json else None
            
            # Fire and forget log
            try:
                from app.services.audit_service import log_action
                log_action(
                    user_uid=user_uid,
                    method=request.method,
                    path=request.path,
                    payload=payload,
                    status_code=response.status_code
                )
            except Exception as e:
                app.logger.error(f"Failed to write audit log: {e}")
                
        return response

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_server_error(_):
        return jsonify({"error": "Internal server error"}), 500

    return app
