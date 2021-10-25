from . import __version__ as app_version

app_name = "spreads"
app_title = "Spreads"
app_publisher = "jan"
app_description = "Spreads"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "janlloydangeles@gmail.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/spreads/css/spreads.css"
# app_include_js = "/assets/spreads/js/spreads.js"

# include js, css files in header of web template
# web_include_css = "/assets/spreads/css/spreads.css"
# web_include_js = "/assets/spreads/js/spreads.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "spreads/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
	"Quotation" : "public/js/quotation.js",
	"Sales Order" : "public/js/sales_order.js",
	"Sales Invoice" : "public/js/sales_invoice.js",
	"Delivery Note" : "public/js/delivery_note.js",
	"Item" : "public/js/item.js",
}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "spreads.install.before_install"
# after_install = "spreads.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "spreads.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"Sales Invoice": {
		"on_submit": "spreads.doc_events.sales_invoice.on_submit_si",
		"validate": "spreads.doc_events.utils.validate_raw_material",
		"on_cancel": "spreads.doc_events.utils.cancel_doc",
	},
	"Delivery Note": {
		"on_submit": "spreads.doc_events.delivery_note.on_submit_dn",
		"validate": "spreads.doc_events.utils.validate_raw_material",
		"on_cancel": "spreads.doc_events.utils.cancel_doc",
	},
	"Sales Order": {
		"on_submit": "spreads.doc_events.sales_order.on_submit_so",
		"validate": "spreads.doc_events.utils.validate_raw_material",
		"on_trash": "spreads.doc_events.sales_order.on_trash_so",
	},
	"Quotation": {
		"validate": "spreads.doc_events.utils.validate_raw_material",
	},
	"Stock Entry": {
		"on_cancel": "spreads.doc_events.utils.cancel_se_doc",
	},
	"Item": {
		"validate": "spreads.doc_events.items.validate_item",
	},
	"Item Group": {
		"validate": "spreads.doc_events.item_group.validate_item_group",
	}
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"spreads.tasks.all"
# 	],
# 	"daily": [
# 		"spreads.tasks.daily"
# 	],
# 	"hourly": [
# 		"spreads.tasks.hourly"
# 	],
# 	"weekly": [
# 		"spreads.tasks.weekly"
# 	]
# 	"monthly": [
# 		"spreads.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "spreads.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "spreads.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "spreads.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]


# User Data Protection
# --------------------

user_data_fields = [
	{
		"doctype": "{doctype_1}",
		"filter_by": "{filter_by}",
		"redact_fields": ["{field_1}", "{field_2}"],
		"partial": 1,
	},
	{
		"doctype": "{doctype_2}",
		"filter_by": "{filter_by}",
		"partial": 1,
	},
	{
		"doctype": "{doctype_3}",
		"strict": False,
	},
	{
		"doctype": "{doctype_4}"
	}
]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"spreads.auth.validate"
# ]
fixtures = [
    {
        "doctype": "Custom Field",
        "filters": [
            [
                "name",
                "in",
                [
                    "Quotation-update_available_stock",
                    "Quotation-section_break_100",
                    "Quotation-rate_of_materials_based_on",
                    "Quotation-section_break_200",
                    "Quotation-raw_material",
                    "Delivery Note-raw_material",
                    "Item-assembled_item",
                    "Sales Order-cost_center",
                    "Sales Invoice-raw_material",
                    "Sales Order-raw_material",
                    "Cost Center-sales_order",
                    "Global Defaults-default_cost_center",
                    "Sales Order-new_project_code",
                    "Sales Order-existing_project_code",
                    "Quotation-price_list",
                    "Sales Order-generate_project_id",
                    "Sales Order-rate_of_materials_based_on",
                    "Sales Order-update_available_stock",
                    "Sales Order-price_list",
                    "Delivery Note-cost_center",

                    "Quotation Item-is_service_item",
                    "Sales Order Item-is_service_item",
                    "Sales Invoice Item-is_service_item",
                    "Delivery Note Item-is_service_item",


                    "Sales Invoice-stock_entry",
                    "Delivery Note-stock_entry",

					"Item Group-item_group_initials",
                    "Item-item_group_initial",
					"Item Group-is_sales_item",
					"Item Group-is_purchase_item",
					"Item Group-is_maintain_stock",
					"Item Group-is_service_item",
					"Item Group-is_fixed_asset",
					"Item Group-has_serial_no",

					"Quotation-column_break_901",
					"Quotation-total_raw_material_expense",
					"Quotation-section_break_902",

					"Sales Order-column_break_901",
					"Sales Order-total_raw_material_expense",
					"Sales Order-section_break_902",

					"Sales Invoice-column_break_901",
					"Sales Invoice-total_raw_material_expense",
					"Sales Invoice-section_break_902",

					"Delivery Note-column_break_901",
					"Delivery Note-total_raw_material_expense",
					"Delivery Note-section_break_902",

					"Quotation-estimated_other_expense",
					"Quotation-estimated_labor_expense",
					"Quotation-estimated_transportation_expense",
					"Quotation-estimated_admin_expense",
					"Quotation-estimated_total_expense",
					"Quotation-column_break_37",

					"Sales Order-update_serial_no",
					"Sales Order-section_break_333",
					"Sales Order-section_break_3333",
					"Sales Order-column_break_222",

					"Sales Order-estimated_other_expense",
					"Sales Order-estimated_labor_expense",
					"Sales Order-estimated_transportation_expense",
					"Sales Order-estimated_admin_expense",
					"Sales Order-estimated_total_expense",
					"Employee-petty_cash_account",
					"Journal Entry-petty_cash_request",
				]
			]
		]
	}
]
