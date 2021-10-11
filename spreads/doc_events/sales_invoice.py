import frappe

@frappe.whitelist()
def on_submit_si(doc, method):
    if doc.update_stock:
        obj = {
            "doctype": "Stock Entry",
            "stock_entry_type": "Material Issue" if not doc.is_return else "Material Receipt",
            "items": get_items(doc),
            "sales_invoice_no": doc.name,
        }

        se = frappe.get_doc(obj).insert()
        se.submit()
        frappe.db.sql(""" UPDATE `tabSales Invoice` SET stock_entry=%s WHERE name=%s """,(se.name,doc.name))
        frappe.db.commit()

def get_items(doc):
    items = []

    for i in doc.raw_material:
        obj = {
            "item_code": i.item_code,
            "qty": i.qty,
            "uom": i.uom,
            "basic_rate": i.rate,
            "serial_no": i.serial_no
        }

        obj["s_warehouse" if not doc.is_return else "t_warehouse"] = i.warehouse

        if doc.cost_center:
            obj['cost_center'] = doc.cost_center

        items.append(obj)
    return items
