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
    if doc.stock_entry:
        condition = "sales_invoice_no = ''" if doc.doctype == "Sales Invoice" else "delivery_note_no = ''"
        stock_entry = doc.stock_entry
        frappe.db.sql(""" UPDATE `tabStock Entry` SET  {0} WHERE name='{1}'""".format(condition, doc.stock_entry))
        frappe.db.sql(""" UPDATE `tab{0}` SET  stock_entry='' WHERE name='{1}'""".format(doc.doctype, doc.name))
        frappe.db.commit()
        se = frappe.get_doc("Stock Entry", stock_entry)
        se.cancel()

@frappe.whitelist()
def cancel_se_doc(doc, method):
    if doc.sales_invoice_no or doc.delivery_note_no:
        doctype = "Sales Invoice" if doc.sales_invoice_no else "Delivery Note"
        value = doc.sales_invoice_no if doctype == "Sales Invoice" else doc.delivery_note_no
        condition = "sales_invoice_no = ''" if doctype == "Sales Invoice" else "delivery_note_no = ''"

        frappe.db.sql(""" UPDATE `tabStock Entry` SET  {0} WHERE name='{1}'""".format(condition, doc.name))
        frappe.db.sql(""" UPDATE `tab{0}` SET  stock_entry='' WHERE name='{1}'""".format(doctype, value))
        frappe.db.commit()