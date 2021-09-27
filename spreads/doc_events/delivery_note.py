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
        cost_center = ""
        if doc.items[0].against_sales_order:
            so = frappe.db.sql(""" SELECT * FROM `tabSales Order` WHERE name=%s""", (doc.items[0].against_sales_order),
                               as_dict=1)
            cost_center = so[0].existing_project_code if len(so) > 0 and so[0].existing_project_code else get_cost_center(
                so[0].existing_project_code) if len(so) > 0 and not so[0].existing_project_code else ""

        items.append({
            "s_warehouse": i.warehouse,
            "item_code": i.item_code_raw_material,
            "qty": i.qty_raw_material,
            "uom": i.uom,
            "basic_rate": i.rate,
            "cost_center": cost_center,
        })
    return items
def get_cost_center(new_project_code):
    return frappe.db.sql(""" SELECT * FROM `tabCost Center` WHERE cost_center_name=%s """, new_project_code,
                         as_dict=1)[0].name