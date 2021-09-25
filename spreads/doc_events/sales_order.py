import frappe

@frappe.whitelist()
def on_submit_so(doc, method):
    if not doc.existing_project_code:
        parent_cc = frappe.get_value("Global Defaults", "Global Defaults", "default_cost_center")
        obj = {
            "doctype": "Cost Center",
            "cost_center_name": doc.name,
            "parent_cost_center": parent_cc,
            "sales_order": doc.name
        }
        frappe.get_doc(obj).insert()
