import frappe


@frappe.whitelist()
def validate_raw_material(doc, method):
    for i in doc.items:
        if i.is_service_item and not doc.raw_material:
            frappe.throw("Raw Material is Mandatory")


def check_raw_material(doc, i):
    for ii in doc.raw_material:
        if ii.service_item == i.item_code:
            return True
    return False