import frappe, json
from erpnext.stock.stock_ledger import get_previous_sle
@frappe.whitelist()
def get_templates(templates, doc):
    data = json.loads(doc)
    data_templates = json.loads(templates)
    print("=======================================")
    print(data)
    print(data['selling_price_list'])
    print(data_templates)
    items = []
    raw_items = []
    for i in data_templates:
        template = frappe.get_doc("BOM Item Template", i)

        for x in template.items:
            rate = get_rate(x.item_code, "",data['rate_of_materials_based_on'] if data['rate_of_materials_based_on'] else "", data['selling_price_list'] if data['selling_price_list'] else "")
            print("ITEM COOOODOE")
            print(x.item_code)
            print(rate[0])
            obj = {
                'item_code': x.item_code,
                'item_name': x.item_name,
                'description': x.item_name,
                'uom': x.uom,
                'qty': x.qty,
                'rate': rate[0],
                'amount': rate[0] * x.qty,
            }
            items.append(obj)

        for x in template.raw_material:
            rate = get_rate(x.item_code, "",data['rate_of_materials_based_on'] if data['rate_of_materials_based_on'] else "", data['selling_price_list'] if data['selling_price_list'] else "")
            obj1 = {
                'item_code': x.item_code,
                'service_item': x.service_item,
                'item_name': x.item_name,
                'description': x.item_name,
                'uom': x.uom,
                'qty': x.qty,
                'rate':  rate[0],
                'buying_price': rate[1],
                'amount': rate[0] * x.qty,
                'warehouse': x.warehouse,
                'serial_no': x.serial_no,
            }
            raw_items.append(obj1)
    return items, raw_items
def get_template_items(items):
    items_ = []
    for i in items:
        items_.append({
            "item_code": i['item_code'],
            "item_name": i['item_name'],
            "batch": i['batch'] if 'batch' in i and i['batch'] else "",
            "qty": i['qty'],
            "uom": i['uom'] if 'uom' in i and i['uom'] else "",
        })
    return items_
def get_template_raw_items(items,price_list):
    items_ = []
    for i in items:
        items_.append({
            "item_code": i['item_code'],
            "item_name": i['item_name'],
            "service_item": i['service_item'],
            "qty": i['qty'],
            "rate": get_rate(i['item_code'],i['warehouse'], "", price_list)[0],
            "amount": i['amount'],
            "warehouse": i['warehouse'] if 'warehouse' in i else "",
            "uom": i['uom'] if 'uom' in i and i['uom'] else "",
            "serial_no": i['serial_no'] if 'serial_no' in i and i['serial_no'] else "",
        })
    return items_
@frappe.whitelist()
def generate_item_templates(items, raw_materials, description,price_list):
    print("GENEEEEEEEEEEEEEEEEEEEEEEEEERAAAAAAAAAAAAAAAAAAAAAATE")
    data = json.loads(items)
    data_raw_materials = json.loads(raw_materials)
    obj = {
        "doctype": "BOM Item Template",
        "description": description,
        "items": get_template_items(data),
        "raw_material": get_template_raw_items(data_raw_materials,price_list),
    }

    frappe.get_doc(obj).insert()
    return data

@frappe.whitelist()
def get_rate(item_code, warehouse, based_on,price_list):
    time = frappe.utils.now_datetime().time()
    date = frappe.utils.now_datetime().date()
    balance = 0
    if warehouse:
        previous_sle = get_previous_sle({
            "item_code": item_code,
            "warehouse": warehouse,
            "posting_date": date,
            "posting_time": time
        })
        balance = previous_sle.get("qty_after_transaction") or 0

    query_selling = """ SELECT * FROM `tabItem Price` WHERE item_code=%s and selling = 1 and price_list=%s ORDER BY valid_from DESC LIMIT 1"""
    item_price_selling = frappe.db.sql(query_selling,(item_code,price_list), as_dict=1)

    query_buying = """ SELECT * FROM `tabItem Price` WHERE item_code=%s and buying = 1 and price_list='Standard Buying' ORDER BY valid_from DESC LIMIT 1"""
    item_price_buying = frappe.db.sql(query_buying,item_code, as_dict=1)


    selling_rate = item_price_selling[0].price_list_rate if len(item_price_selling) > 0 else 0
    buying_rate = item_price_buying[0].price_list_rate if len(item_price_buying) > 0 else 0


    return selling_rate, buying_rate, balance

@frappe.whitelist()
def set_available_qty(items):
    data = json.loads(items)
    time = frappe.utils.now_datetime().time()
    date = frappe.utils.now_datetime().date()
    for d in data:
        previous_sle = get_previous_sle({
            "item_code": d['item_code'],
            "warehouse": d['warehouse'],
            "posting_date": date,
            "posting_time": time
        })
        d['available_qty'] = previous_sle.get("qty_after_transaction") or 0
    print(data)
    return data

@frappe.whitelist()
def update_serial_no(items):
    data = json.loads(items)
    for d in data:
        serial_no = frappe.db.sql(""" SELECT * FROM `tabSerial No` WHERE item_code=%s ORDER BY purchase_time DESC""", d['item_code'], as_dict=1)
        d['serial_no'] = serial_no[0].name if len(serial_no) > 0 else ""
    print(data)
    return data

@frappe.whitelist()
def filter_item(doctype, txt, searchfield, start, page_len, filters):
    return frappe.db.sql("""
        SELECT name, description, item_group FROM `tabItem` 
        WHERE is_stock_item = 1 AND ({key} LIKE %(txt)s)  
        ORDER BY
            IF(LOCATE(%(_txt)s, name), LOCATE(%(_txt)s, name), 99999),
            name
        LIMIT %(start)s, %(page_len)s
    """.format(**{
            'key': searchfield,
        }), {
        'txt': "%{}%".format(txt),
        '_txt': txt.replace("%", ""),
        'start': start,
        'page_len': page_len
    })

@frappe.whitelist()
def update_price(items,price_list):
    if items:
        data = json.loads(items)
        for d in data:
            d['rate'] = get_rate(d['item_code'],d['warehouse'], "", price_list)[0]
        return data
    return []