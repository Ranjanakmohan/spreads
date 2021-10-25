import frappe
from frappe.model.mapper import get_mapped_doc
from frappe.utils import flt
@frappe.whitelist()
def on_trash_so(doc, method):
    frappe.db.sql(""" UPDATE `tabCost Center` Set sales_order='' WHERE sales_order=%s""",doc.name)
    frappe.db.commit()
@frappe.whitelist()
def generate_cc(name,customer):
    parent_cc = frappe.get_value("Global Defaults", "Global Defaults", "default_cost_center")
    if parent_cc:
        obj = {
            "doctype": "Cost Center",
            "cost_center_name": customer + "-" + name,
            "parent_cost_center": parent_cc,
            "sales_order": name
        }
        cc = frappe.get_doc(obj).insert()
        frappe.db.sql(""" UPDATE `tabSales Order` SET cost_center=%s WHERE name=%s""",(cc.name, name))
        frappe.db.commit()
        return True
    else:
        frappe.throw("Please set Default Project Code in Global Defaults for Parent Project Code for New Project Code")


@frappe.whitelist()
def on_submit_so(doc, method):
    if not doc.cost_center and len(doc.raw_material) > 0:
        frappe.throw("Please Select Existing or Generate Project Code")


@frappe.whitelist()
def make_mr(source_name, target_doc=None):
    print("==================================================")
    doc = get_mapped_doc("Sales Order", source_name, {
        "Sales Order": {
            "doctype": "Material Request",
            "validation": {
                "docstatus": ["=", 1]
            }
        },
        "Raw Material": {
            "doctype": "Material Request Item",
            "field_map": {
                "name": "raw_material",
                "parent": "sales_order"
            },
        }
    }, target_doc)

    return doc