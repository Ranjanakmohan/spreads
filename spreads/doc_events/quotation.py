import frappe
from erpnext.stock.stock_ledger import get_previous_sle
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
        # get actual stock at source warehouse
        balance = previous_sle.get("qty_after_transaction") or 0

    condition = ""
    if price_list == "Standard Buying":
        condition += " and buying = 1 "
    elif price_list == "Standard Selling":
        condition += " and selling = 1 and price_list='{0}'".format('Standard Selling')

    query = """ SELECT * FROM `tabItem Price` WHERE item_code=%s {0} ORDER BY valid_from DESC LIMIT 1""".format(condition)

    item_price = frappe.db.sql(query,item_code, as_dict=1)
    rate = item_price[0].price_list_rate if len(item_price) > 0 else 0
    print(based_on)
    if based_on == "Valuation Rate":
        item_record = frappe.db.sql(
            """ SELECT * FROM `tabItem` WHERE item_code=%s""",
            item_code, as_dict=1)
        rate = item_record[0].valuation_rate if len(item_record) > 0 else 0
    if based_on == "Last Purchase Rate":
        item_record = frappe.db.sql(
            """ SELECT * FROM `tabItem` WHERE item_code=%s""",
            item_code, as_dict=1)
        rate = item_record[0].last_purchase_rate if len(item_record) > 0 else 0
    return rate, balance

@frappe.whitelist()
def set_available_qty(self):
    time = frappe.utils.now_datetime().time()
    date = frappe.utils.now_datetime().date()
    for d in self.get('raw_material'):
        previous_sle = get_previous_sle({
            "item_code": d.item_code,
            "warehouse": d.warehouse,
            "posting_date": date,
            "posting_time": time
        })
        # get actual stock at source warehouse
        d.available_qty = previous_sle.get("qty_after_transaction") or 0

@frappe.whitelist()
def filter_item(doctype, txt, searchfield, start, page_len, filters):
    return frappe.db.sql("""
        SELECT name, description, item_group FROM `tabItem` 
        WHERE (item_group='Raw Material' or assembled_item = 1) AND ({key} LIKE %(txt)s)  
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