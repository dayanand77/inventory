from dotenv import load_dotenv

load_dotenv(override=True)

from flask import Flask, jsonify
from flask_cors import CORS

from app.api.auth_routes import auth_bp
from app.api.dashboard_routes import dashboard_bp
from app.api.inventory_routes import inventory_bp
from app.api.notification_routes import notification_bp
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

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_server_error(_):
        return jsonify({"error": "Internal server error"}), 500

    return app
