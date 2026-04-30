from flask import Blueprint, g, jsonify, request, current_app
from app.core.auth import require_auth
from app.services.department_service import (
    create_department,
    list_departments,
    get_department,
    allocate_to_department,
    get_department_allocations,
    record_department_usage,
    get_department_consumption,
    get_department_summary,
)

department_bp = Blueprint("department", __name__, url_prefix="/api/departments")


@department_bp.post("")
@require_auth(allowed_roles=["ADMIN"])
def create_new_department():
    """Create a new department"""
    payload = request.get_json(silent=True) or {}
    
    name = payload.get("name")
    description = payload.get("description", "")
    contact_info = payload.get("contactInfo", "")
    
    try:
        dept = create_department(name, description, contact_info)
        return jsonify({
            "department": dept,
            "message": "Department created successfully"
        }), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@department_bp.get("")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def list_all_departments():
    """Get all active departments"""
    depts = list_departments()
    return jsonify({"departments": depts, "count": len(depts)})


@department_bp.get("/<dept_id>")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_dept_info(dept_id):
    """Get specific department information"""
    try:
        dept = get_department(dept_id)
        return jsonify({"department": dept})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 404


@department_bp.post("/<dept_id>/allocate")
@require_auth(allowed_roles=["ADMIN"])
def allocate_items(dept_id):
    """Allocate items to a department"""
    payload = request.get_json(silent=True) or {}
    
    item_id = payload.get("itemId")
    quantity = payload.get("quantity")
    
    try:
        allocation = allocate_to_department(
            item_id, dept_id, quantity, g.current_user
        )
        return jsonify({
            "allocation": allocation,
            "message": "Items allocated successfully"
        }), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@department_bp.get("/<dept_id>/allocations")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_dept_allocations(dept_id):
    """Get all active allocations for a department"""
    try:
        allocations = get_department_allocations(department_id=dept_id)
        return jsonify({"allocations": allocations, "count": len(allocations)})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@department_bp.post("/allocations/<allocation_id>/usage")
@require_auth(allowed_roles=["ADMIN"])
def record_usage(allocation_id):
    """Record usage of allocated items"""
    payload = request.get_json(silent=True) or {}
    
    used_quantity = payload.get("usedQuantity")
    
    try:
        usage = record_department_usage(allocation_id, used_quantity, g.current_user)
        return jsonify({
            "usage": usage,
            "message": "Usage recorded successfully"
        }), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@department_bp.get("/<dept_id>/consumption")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_dept_consumption(dept_id):
    """Get consumption history for a department"""
    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")
    
    try:
        consumption = get_department_consumption(
            dept_id, start_date=start_date, end_date=end_date
        )
        return jsonify({
            "consumption": consumption,
            "count": len(consumption)
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@department_bp.get("/<dept_id>/summary")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_dept_summary(dept_id):
    """Get allocation and consumption summary for a department"""
    try:
        summary = get_department_summary(dept_id)
        return jsonify(summary)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@department_bp.get("/allocations/item/<item_id>")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_item_allocations(item_id):
    """Get all allocations for a specific item across departments"""
    try:
        allocations = get_department_allocations(item_id=item_id)
        return jsonify({"allocations": allocations, "count": len(allocations)})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
