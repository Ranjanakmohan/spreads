import frappe
from frappe.utils import now

@frappe.whitelist()
def validate_raw_material(doc, method):
    for i in doc.items:
        if i.is_service_item and not doc.raw_material:
            frappe.throw("Raw Material is Mandatory")

@frappe.whitelist()
def cancel_doc(doc, method):
    frappe.db.sql("""update `tabStock Ledger Entry` set is_cancelled=1,
    		modified=%s, modified_by=%s
    		where voucher_type=%s and voucher_no=%s and is_cancelled = 0""",
                  (now(), frappe.session.user, doc.doctype, doc.name))
    frappe.db.sql("""update `tabGL Entry` set is_cancelled=1,
        		modified=%s, modified_by=%s
        		where voucher_type=%s and voucher_no=%s and is_cancelled = 0""",
                  (now(), frappe.session.user, doc.doctype, doc.name))
    frappe.db.commit()
