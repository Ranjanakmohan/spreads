import frappe

def validate_item_group(doc, method):
    if doc.parent_item_group != "All Item Group" and not doc.is_group:

        doc.is_maintain_stock = frappe.db.get_value('Item Group', doc.parent_item_group, "is_maintain_stock")
        doc.is_sales_item = frappe.db.get_value('Item Group', doc.parent_item_group, "is_sales_item")
        doc.is_purchase_item = frappe.db.get_value('Item Group', doc.parent_item_group, "is_purchase_item")
        doc.is_fixed_asset = frappe.db.get_value('Item Group', doc.parent_item_group, "is_fixed_asset")
        doc.is_service_item = frappe.db.get_value('Item Group', doc.parent_item_group, "is_service_item")
        doc.has_serial_no = frappe.db.get_value('Item Group', doc.parent_item_group, "has_serial_no")