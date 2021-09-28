import frappe

import frappe
from erpnext.accounts.utils import get_fiscal_year
from frappe.utils import cint, flt, cstr, get_link_to_form, nowtime
from erpnext.accounts.utils import get_fiscal_year
@frappe.whitelist()
def on_submit_dn(doc, method):
    from erpnext.stock.stock_ledger import make_sl_entries
    make_sl_entries(get_items(doc, doc.is_return), False, False)
    make_gl_entries(doc, doc.is_return)
def get_items(self, is_return):
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
            "actual_qty": (1 if is_return else -1) * abs(flt(d.get("qty_raw_material"))),
            "stock_uom": frappe.db.get_value("Item", d.get("item_code"), "stock_uom"),
            "incoming_rate": 0,
            "company": self.company,
            "is_cancelled": 1 if self.docstatus == 2 else 0
        }))

    return items

def get_amount(doc):
    amount = 0
    for i in doc.raw_material:
        amount += i.qty_raw_material * i.rate
    return amount
def make_gl_entries(doc, is_return):
    amount = get_amount(doc)
    debit_obj = {
        "doctype": "GL Entry",
        "posting_date": doc.posting_date,
        "account": frappe.get_cached_value('Company',  doc.company,  "default_expense_account"),
        "cost_center": doc.cost_center,
        "debit": abs(amount) if not is_return else 0,
        "debit_in_account_currency": abs(amount) if not is_return else 0,
        "credit": 0 if not is_return else abs(amount),
        "credit_in_account_currency": 0 if not is_return else abs(amount),
        "account_currency": doc.currency,
        "against": frappe.get_cached_value('Company',  doc.company,  "default_inventory_account"),
        "voucher_type": doc.doctype,
        "voucher_no": doc.name,
        "remarks": "Accounting Entry for Raw Material",
        "is_opening": "No",
        "is_advance": "No",
        "fiscal_year": get_fiscal_year(doc.posting_date, company=doc.company)[0],
        "company": doc.company,
        "is_cancelled": 0,
    }
    credit_obj = {
        "doctype": "GL Entry",
        "posting_date": doc.posting_date,
        "account": frappe.get_cached_value('Company', doc.company, "default_inventory_account"),
        "cost_center": doc.cost_center,
        "debit": 0 if not is_return else abs(amount),
        "debit_in_account_currency": 0 if not is_return else abs(amount),
        "credit": abs(amount) if not is_return else 0,
        "credit_in_account_currency": abs(amount) if not is_return else 0,
        "account_currency": doc.currency,
        "against": frappe.get_cached_value('Company', doc.company, "default_expense_account"),
        "voucher_type": doc.doctype,
        "voucher_no": doc.name,
        "remarks": "Accounting Entry for Raw Material",
        "is_opening": "No",
        "is_advance": "No",
        "fiscal_year": get_fiscal_year(doc.posting_date, company=doc.company)[0],
        "company": doc.company,
        "is_cancelled": 0,
    }
    debit = frappe.get_doc(debit_obj).insert(ignore_permissions=1)
    debit.submit()
    credit = frappe.get_doc(credit_obj).insert(ignore_permissions=1)
    credit.submit()
