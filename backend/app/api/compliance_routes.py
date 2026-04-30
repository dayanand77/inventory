from flask import Blueprint, g, jsonify, request, current_app
from app.core.auth import require_auth
from app.services.compliance_service import (
    get_compliance_standards,
    add_compliance_record,
    get_item_compliance,
    get_compliance_report,
    get_non_compliant_items,
    get_compliance_audit_log,
    get_compliance_summary,
    generate_compliance_report,
)

compliance_bp = Blueprint("compliance", __name__, url_prefix="/api/compliance")


@compliance_bp.get("/standards")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_standards():
    """Get list of supported compliance standards"""
    standards = get_compliance_standards()
    return jsonify({"standards": standards})


@compliance_bp.post("/items/<item_id>")
@require_auth(allowed_roles=["ADMIN"])
def add_item_compliance(item_id):
    """Add compliance standards to an item"""
    payload = request.get_json(silent=True) or {}
    
    standards = payload.get("standards", [])
    details = payload.get("details", "")
    
    try:
        record = add_compliance_record(
            item_id, standards, details, g.current_user
        )
        return jsonify({
            "record": record,
            "message": "Compliance record added successfully"
        }), 201
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@compliance_bp.get("/items/<item_id>")
@require_auth(allowed_roles=["ADMIN", "STAFF"])
def get_item_compliance_records(item_id):
    """Get compliance records for a specific item"""
    try:
        records = get_item_compliance(item_id)
        return jsonify({"records": records, "count": len(records)})
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@compliance_bp.get("/report")
@require_auth(allowed_roles=["ADMIN"])
def get_report():
    """Get compliance report
    
    Query parameters:
    - standard: specific standard to filter by (e.g., ISO 13485)
    - type: report type (summary, non_compliant, by_standard)
    """
    standard = request.args.get("standard")
    report_type = request.args.get("type", "summary")
    
    try:
        if standard:
            items = get_compliance_report(standard)
            return jsonify({
                "report_type": "by_standard",
                "standard": standard,
                "items": items,
                "count": len(items)
            })
        else:
            report = generate_compliance_report(report_type)
            return jsonify(report)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@compliance_bp.get("/non-compliant")
@require_auth(allowed_roles=["ADMIN"])
def get_non_compliant():
    """Get items that are not marked with any compliance standards"""
    items = get_non_compliant_items()
    return jsonify({
        "items": items,
        "count": len(items),
        "message": "Items without compliance standards"
    })


@compliance_bp.get("/summary")
@require_auth(allowed_roles=["ADMIN"])
def get_summary():
    """Get compliance summary across all inventory"""
    summary = get_compliance_summary()
    return jsonify(summary)


@compliance_bp.get("/audit-log")
@require_auth(allowed_roles=["ADMIN"])
def audit_log():
    """Get audit log of compliance records
    
    Query parameters:
    - startDate: ISO format date
    - endDate: ISO format date
    """
    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")
    
    try:
        logs = get_compliance_audit_log(
            start_date=start_date,
            end_date=end_date
        )
        return jsonify({
            "logs": logs,
            "count": len(logs)
        })
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
