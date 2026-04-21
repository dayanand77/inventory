import csv
from io import BytesIO, StringIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from app.core.db import get_db


def build_inventory_csv():
    db = get_db()
    items = list(db.inventory_items.find({}).sort("name", 1))

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Item Code",
            "Name",
            "Category",
            "Location",
            "Total Quantity",
            "Available Quantity",
            "Issued Quantity",
            "Low Stock",
        ]
    )

    for item in items:
        writer.writerow(
            [
                item.get("itemCode", ""),
                item.get("name", ""),
                item.get("category", ""),
                item.get("location", ""),
                item.get("totalQuantity", 0),
                item.get("availableQuantity", 0),
                item.get("issuedQuantity", 0),
                "Yes" if item.get("isLowStock") else "No",
            ]
        )

    return output.getvalue()


def build_inventory_pdf():
    db = get_db()
    items = list(db.inventory_items.find({}).sort("name", 1))

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(0.75 * inch, height - 0.75 * inch, "Medical College Inventory Report")

    pdf.setFont("Helvetica", 10)
    y = height - 1.25 * inch
    row_height = 0.22 * inch

    for item in items:
        line = (
            f"{item.get('itemCode', '')} | {item.get('name', '')} | "
            f"Avail: {item.get('availableQuantity', 0)} | "
            f"Issued: {item.get('issuedQuantity', 0)}"
        )
        pdf.drawString(0.75 * inch, y, line[:120])
        y -= row_height

        if y < 0.75 * inch:
            pdf.showPage()
            pdf.setFont("Helvetica", 10)
            y = height - 0.75 * inch

    pdf.save()
    buffer.seek(0)
    return buffer.read()
