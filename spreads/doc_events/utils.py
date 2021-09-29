import frappe
from frappe.utils import now, flt
from erpnext.accounts.utils import get_fiscal_year

@frappe.whitelist()
def validate_raw_material(doc, method):
    for i in doc.items:
        if i.is_service_item and not doc.raw_material:
            frappe.throw("Raw Material is Mandatory")

@frappe.whitelist()
def cancel_doc(doc, method):
    from erpnext.stock.stock_ledger import make_sl_entries
    make_sl_entries(get_items(doc), False, False)
    frappe.db.sql("""update `tabStock Ledger Entry` set is_cancelled=1,
       		modified=%s, modified_by=%s
       		where voucher_type=%s and voucher_no=%s and is_cancelled = 0""",
                  (now(), frappe.session.user, doc.doctype, doc.name))
    frappe.db.sql("""update `tabGL Entry` set is_cancelled=1,
           		modified=%s, modified_by=%s
           		where voucher_type=%s and voucher_no=%s and is_cancelled = 0""",
                  (now(), frappe.session.user, doc.doctype, doc.name))
    frappe.db.commit()


def get_items(self):
    items = []
    for d in self.raw_material:
        items.append(frappe._dict({
            "item_code": d.get("item_code_raw_material", None),
            "warehouse": d.get("warehouse", None),
            "posting_date": self.posting_date,
            "posting_time": self.posting_time,
            'fiscal_year': get_fiscal_year(self.posting_date, company=self.company)[0],
            "voucher_type": self.doctype,
            "voucher_no": self.name,
            "voucher_detail_no": d.name,
            "actual_qty": abs(flt(d.get("qty_raw_material"))),
            "stock_uom": frappe.db.get_value("Item", d.get("item_code"), "stock_uom"),
            "incoming_rate":  d.rate,
            "company": self.company,
            "is_cancelled": 1
        }))

    return items
