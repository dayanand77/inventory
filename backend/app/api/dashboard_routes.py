from flask import Blueprint, jsonify

from app.core.auth import require_auth
from app.services.dashboard_service import (
    get_category_breakdown,
    get_low_stock_items,
    get_metrics,
    get_monthly_usage,
)


dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.get("/metrics")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def metrics():
    return jsonify({"metrics": get_metrics()})


@dashboard_bp.get("/category-breakdown")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def category_breakdown():
    return jsonify({"categories": get_category_breakdown()})


@dashboard_bp.get("/monthly-usage")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def monthly_usage():
    return jsonify({"usage": get_monthly_usage()})


@dashboard_bp.get("/low-stock")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def low_stock_items():
    return jsonify({"items": get_low_stock_items()})
