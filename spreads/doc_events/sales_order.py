import frappe

@frappe.whitelist()
def generate_cc(name):
    parent_cc = frappe.get_value("Global Defaults", "Global Defaults", "default_cost_center")
    if parent_cc:
        obj = {
            "doctype": "Cost Center",
            "cost_center_name": name,
            "parent_cost_center": parent_cc,
            "sales_order": name
        }
        cc = frappe.get_doc(obj).insert()
        frappe.db.sql(""" UPDATE `tabSales Order` SET project_code=%s WHERE name=%s""",(cc.name, name))
        frappe.db.commit()
        return True
    else:
        frappe.throw("Please set Default Project Code in Global Defaults for Parent Project Code for New Project Code")