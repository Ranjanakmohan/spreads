import frappe

@frappe.whitelist()
def on_submit_dn(doc, method):
    obj = {
        "doctype": "Stock Entry",
        "stock_entry_type": "Material Issue",
        "items": get_items(doc),
    }
    se = frappe.get_doc(obj).insert()
    se.submit()
def get_items(doc):
    items = []

    for i in doc.raw_material:
        obj = {
            "s_warehouse": i.warehouse,
            "item_code": i.item_code_raw_material,
            "qty": i.qty_raw_material,
            "uom": i.uom,
            "basic_rate": i.rate
        }

        if doc.cost_center:
            obj['cost_center'] = doc.cost_center

        items.append(obj)
    return items
