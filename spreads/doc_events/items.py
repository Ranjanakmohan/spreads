import frappe


@frappe.whitelist()
def validate_item(doc, method):
    item_name_based = frappe.db.get_single_value('Stock Settings', 'item_naming_by')
    print(item_name_based)

    doc.is_stock_item = frappe.db.get_value('Item Group', doc.item_group, "is_maintain_stock")
    doc.is_sales_item = frappe.db.get_value('Item Group', doc.item_group, "is_sales_item")
    doc.is_purchase_item = frappe.db.get_value('Item Group', doc.item_group, "is_purchase_item")
    doc.is_fixed_asset = frappe.db.get_value('Item Group', doc.item_group, "is_fixed_asset")
    doc.is_service_item = frappe.db.get_value('Item Group', doc.item_group, "is_service_item")
    doc.has_serial_no = frappe.db.get_value('Item Group', doc.item_group, "has_serial_no")

    if item_name_based == "Naming Series" and not doc.item_group_initial:
        doc.item_group_initial = frappe.db.get_value('Item Group', doc.item_group, "item_group_initials")

        if not doc.naming_series:
            doc.naming_series = "ITEM-.{item_group_initial}.-.#####"

        if not doc.item_group_initial:
            frappe.throw("Item naming is based on Naming Series and Item Group Initial is required. Please check Item Group Initidals in Item Group Master")