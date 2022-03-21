import frappe, json
from frappe.model.mapper import get_mapped_doc
from spreads.doc_events.account_controller import update_child_qty_rate


@frappe.whitelist()
def update_raw_material(parent_doctype,raw_material,parent_doctype_name,child_docname):
    print("UPDAAAAAAAAAAAAAAAAAAAAAAAATE")
    data = []
    raw_materials = json.loads(raw_material)
    items = frappe.get_doc("Sales Order", parent_doctype_name).items
    frappe.db.sql(""" DELETE FROm `tabRaw Material` WHERE parent= %s""",parent_doctype_name)
    frappe.db.commit()
    for i in items:
        total = 0
        for x in raw_materials:
            rate = x['rate'] if 'rate' in x else 0
            if x['service_item']:
                if i.item_code == x['service_item']:
                    total += (x['qty'] * rate)
        data.append({
            "docname": i.name,
            "name": i.name,
            "item_code": i.item_code,
            "delivery_date": i.delivery_date,
            "conversion_factor": i.conversion_factor,
            "qty": i.qty,
            "rate": total,
            "uom": i.uom,
            "idx": i.idx,
            "__checked": 1
        })
    update_child_qty_rate(parent_doctype,data, parent_doctype_name)
    create_raw_material(raw_materials, parent_doctype_name)

def create_raw_material(items,parent_doctype_name):
    total_raw_material_expense = total_raw_material_buying_expense = 0
    for item in items:
        rate = item['rate'] if 'rate' in item else 0
        total_raw_material_expense += (item['qty'] * rate)
        buying_price = item['buying_price'] if 'buying_price' in item else 0
        total_raw_material_buying_expense += (item['qty'] * buying_price)
        item['parent'] = parent_doctype_name
        item['parenttype'] = "Sales Order"
        item['parentfield'] = "raw_material"
        item['doctype'] = "Raw Material"
        frappe.get_doc(item).insert()
    raw_material_profit = total_raw_material_expense - total_raw_material_buying_expense
    frappe.db.sql(""" UPDATE `tabSales Order` SET raw_material_profit=%s, total_raw_material_expense=%s, total_raw_material_buying_expense=%s WHERE name=%s""",
                  (raw_material_profit, total_raw_material_expense, total_raw_material_buying_expense, parent_doctype_name))
    frappe.db.commit()
def update_so(doc, method):
    data = []
    for i in doc.items:
        total = 0
        for x in doc.raw_material:
            if x.service_item:
                if i.item_code == x.service_item:
                    x.amount += total
        data.append({
            "docname": i.name,
            "name": i.name,
            "item_code": i.item_code,
            "delivery_date": i.delivery_date,
            "conversion_factor": i.conversion_factor,
            "qty": i.qty,
            "rate": total,
            "uom": i.uom,
            "idx": i.idx,
            "__checked": 1
        })

    update_child_qty_rate(doc.doctype,data, doc.name)
@frappe.whitelist()
def update_item_table(items, raw_materials):
    data = json.loads(items)
    materials = json.loads(raw_materials)

    for i in data:
        total = 0
        for x in materials:
            if 'service_item' in x:
                if i['item_code'] == x['service_item']:
                    total += x['amount']
        frappe.db.sql(""" UPDATE `tabSales Order Item` SET rate=%s, amount=%s WHERE name=%s""",(total, total,i['name']))
        frappe.db.commit()
@frappe.whitelist()
def update_totals(total, grand_total, rounded_total, name):
    frappe.db.sql(""" UPDATE `tabSales Order` 
                    SET total=%s, grand_total=%s, rounded_total=%s 
                    WHERE name=%s""",(total, grand_total, rounded_total, name))
    frappe.db.commit()
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
    if doc.existing_project_code and not doc.cost_center and doc.raw_material:
        frappe.throw("Please Select Existing or Generate Project Code")

    if not doc.existing_project_code and not doc.cost_center:
        frappe.throw("Please Select Existing or Generate Project Code")

@frappe.whitelist()
def make_mr(source_name, target_doc=None):
    print("==================================================")
    doc = get_mapped_doc("Sales Order", source_name, {
        "Sales Order": {
            "doctype": "Material Request",
            "validation": {
                "docstatus": ["=", 1]
            },
            "field_map": {
                "delivery_date": "schedule_date",
            },
        },
        "Raw Material": {
            "doctype": "Material Request Item",
            "field_map": {
                "name": "raw_material",
                "parent": "sales_order",
                "item_name": "description",
            },
        }
    }, target_doc)

    return doc