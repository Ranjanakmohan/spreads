var warehouse = ""
frappe.ui.form.on('Sales Order', {
	refresh: function(frm, cdt, cdn) {
        cur_frm.add_custom_button(__('MR for Raw Materials'), () => cur_frm.trigger("mr_material_request"), __('Create'));
        cur_frm.add_custom_button(__('Custom Sales Invoice'), () => cur_frm.trigger("make_sales_invoice"), __('Create'));
        cur_frm.add_custom_button(__('Custom Delivery Note'), () => cur_frm.trigger("make_delivery_note_based_on_delivery_date"), __('Create'));

    },
    mr_material_request: function() {
		frappe.model.open_mapped_doc({
			method: "spreads.doc_events.sales_order.make_mr",
			frm: cur_frm
		})
    },
    make_sales_invoice: function() {
        if(check_serial_no(cur_frm)){
            frappe.model.open_mapped_doc({
                method: "erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice",
                frm: cur_frm
		    })
        } else {
            frappe.throw("Serial No is mandatory in raw material")
        }

	},
    make_delivery_note_based_on_delivery_date: function(frm) {
		var me = this;

		var delivery_dates = [];
		$.each(cur_frm.doc.items || [], function(i, d) {
			if(!delivery_dates.includes(d.delivery_date)) {
				delivery_dates.push(d.delivery_date);
			}
		});

		var item_grid = cur_frm.fields_dict["items"].grid;
		if(!item_grid.get_selected().length && delivery_dates.length > 1) {
			var dialog = new frappe.ui.Dialog({
				title: __("Select Items based on Delivery Date"),
				fields: [{fieldtype: "HTML", fieldname: "dates_html"}]
			});

			var html = $(`
				<div style="border: 1px solid #d1d8dd">
					<div class="list-item list-item--head">
						<div class="list-item__content list-item__content--flex-2">
							${__('Delivery Date')}
						</div>
					</div>
					${delivery_dates.map(date => `
						<div class="list-item">
							<div class="list-item__content list-item__content--flex-2">
								<label>
								<input type="checkbox" data-date="${date}" checked="checked"/>
								${frappe.datetime.str_to_user(date)}
								</label>
							</div>
						</div>
					`).join("")}
				</div>
			`);

			var wrapper = dialog.fields_dict.dates_html.$wrapper;
			wrapper.html(html);

			dialog.set_primary_action(__("Select"), function() {
				var dates = wrapper.find('input[type=checkbox]:checked')
					.map((i, el) => $(el).attr('data-date')).toArray();

				if(!dates) return;

				$.each(dates, function(i, d) {
					$.each(item_grid.grid_rows || [], function(j, row) {
						if(row.doc.delivery_date == d) {
							row.doc.__checked = 1;
						}
					});
				})
				cur_frm.trigger("make_delivery_note")
				dialog.hide();
			});
			dialog.show();
		} else {
		    cur_frm.trigger("make_delivery_note")
		}
	},
    make_delivery_note: function(frm) {
	    if(check_serial_no(cur_frm)){
	        frappe.model.open_mapped_doc({
                method: "erpnext.selling.doctype.sales_order.sales_order.make_delivery_note",
                frm: cur_frm
		    })
        } else {
            frappe.throw("Serial No is mandatory in raw material")
        }

	}
})
function check_serial_no(cur_frm) {
    for(var x=0;x<cur_frm.doc.raw_material.length;x+=1){
        if(!cur_frm.doc.raw_material[x].serial_no)
            return false
    }
    return true
}
cur_frm.cscript.onload_post_render = function(){
 $('input[data-fieldname="total_raw_material_expense"]').css("border","3px solid blue")

    cur_frm.set_query('cost_center', () => {
        return {
            filters: {
                is_group: 0
            }
        }
    })
    cur_frm.set_query("item_code", "raw_material", () => {
            return {
                    filters: {
                        is_stock_item: 1
                }

            }
        })
 frappe.db.get_single_value('Stock Settings', 'default_warehouse')
        .then(ans => {
            console.log("TEST")
            console.log(ans.default_warehouse)
            warehouse = ans
    if(cur_frm.doc.raw_material.length > 0 && cur_frm.doc.docstatus < 1){
        cur_frm.doc.raw_material[0].warehouse = ans
        cur_frm.refresh_field("raw_material")
    }
        })

}
cur_frm.cscript.generate_project_id = function(){
frappe.call({
    method: "spreads.doc_events.sales_order.generate_cc",
    args: {
        name: cur_frm.doc.name,
        customer: cur_frm.doc.customer_name
    },
    async: false,
    callback: function (r) {
        if(r.message){
            cur_frm.reload_doc()
         frappe.show_alert({
            message:__('Project Code Created'),
            indicator:'green'
        }, 3);
        }
    }
})
}
erpnext.utils.update_raw_items = function(opts) {
	const frm = opts.frm;
	const cannot_add_row = (typeof opts.cannot_add_row === 'undefined') ? true : opts.cannot_add_row;
	const child_docname = (typeof opts.cannot_add_row === 'undefined') ? "raw_material" : opts.child_docname;
	const child_meta = frappe.get_meta("Raw Material");
	console.log(child_meta)
	const get_precision = (fieldname) => child_meta.fields.find(f => f.fieldname == fieldname).precision;

	this.data = [];
	const fields = [{
		fieldtype:'Data',
		fieldname:"docname",
		read_only: 1,
		hidden: 1,
	},
    {
		fieldtype:'Link',
		fieldname:"item_code",
		options: 'Item',
		in_list_view: 1,
		read_only: 0,
		disabled: 0,
		label: __('Item Code'),
		get_query: function() {
			let filters;
			if (frm.doc.doctype === 'Sales Order') {
				filters = {"is_sales_item": 1};
			} else if (frm.doc.doctype === 'Purchase Order') {
				if (frm.doc.is_subcontracted === "Yes") {
					filters = {"is_sub_contracted_item": 1};
				} else {
					filters = {"is_purchase_item": 1};
				}
			}
			return {
				query: "erpnext.controllers.queries.item_query",
				filters: filters
			};
		}
	},{
		fieldtype:'Link',
		options:'Item',
		fieldname:"service_item",
		in_list_view: 1,
		label: __('Service Item'),
        get_query: function() {
            let filters;
             var names = Array.from(cur_frm.doc.items, x => "item_code" in x ? x.item_code:"")

                filters = [
                   ["name", "in",names],
                   ["assembled_item", "=",1],

               ]
            return {
                query: "erpnext.controllers.queries.item_query",
                filters: filters
            };
        }
	},
    {
		fieldtype:'Float',
		fieldname:"qty",
		default: 0,
		read_only: 0,
		in_list_view: 1,
		label: __('Qty'),
		precision: get_precision("qty")
	},
        {
		fieldtype:'Currency',
		fieldname:"buying_price",
		default: 0,
		label: __('Buying Price'),
	},
        {
		fieldtype:'Currency',
		fieldname:"rate",
		default: 0,
		label: __('Selling Price'),
            		in_list_view: 1,

	},
     {
		fieldtype:'Link',
		options:'Warehouse',
		fieldname:"warehouse",
		label: __('Warehouse'),

	}
];

	const dialog = new frappe.ui.Dialog({
		title: __("Update Items"),
		fields: [
			{
				fieldname: "trans_items",
				fieldtype: "Table",
				label: "Items",
				cannot_add_rows: cannot_add_row,
				in_place_edit: false,
				reqd: 1,
				data: this.data,
				get_data: () => {
					return this.data;
				},
				fields: fields
			},
		],
		primary_action: function() {
			const trans_items = this.get_values()["trans_items"].filter((item) => !!item.item_code);
			frappe.call({
				method: 'spreads.doc_events.sales_order.update_raw_material',
				freeze: true,
				args: {
					'parent_doctype': frm.doc.doctype,
					'raw_material': trans_items,
					'parent_doctype_name': frm.doc.name,
					'child_docname': "raw_material"
				},
				callback: function() {
					frm.reload_doc();
				}
			});
			this.hide();
			refresh_field("items");
		},
		primary_action_label: __('Update')
	});

	frm.doc['raw_material'].forEach(d => {
	    console.log("RAW MATERIAL")
	    console.log(d)
		dialog.fields_dict.trans_items.df.data.push({
			"docname": d.name,
			"name": d.name,
			"item_code": d.item_code,
			"service_item": d.service_item,
			"delivery_date": d.delivery_date,
			"schedule_date": d.schedule_date,
			"conversion_factor": d.conversion_factor,
			"qty": d.qty,
			"rate": d.rate,
			"uom": d.uom,
			"buying_price": d.buying_price,
			"warehouse": d.warehouse,
		});
		this.data = dialog.fields_dict.trans_items.df.data;
		dialog.fields_dict.trans_items.grid.refresh();
	})
	dialog.show();
}

frappe.ui.form.on('Sales Order', {

    selling_price_list: function () {
      cur_frm.trigger("update_price_list")
    },
	refresh: function(frm) {
		cur_frm.fields_dict["raw_material"].grid.add_custom_button(__('Update Available Stock'),
			function() {
				cur_frm.trigger('update_available_stock')
        });
        cur_frm.fields_dict["raw_material"].grid.grid_buttons.find('.btn-custom').removeClass('btn-default').addClass('btn-primary');

        cur_frm.set_query("service_item", "raw_material", ()=>{
           var names = Array.from(cur_frm.doc.items, x => "item_code" in x ? x.item_code:"")
           return {
               filters: [
                   ["name", "in",names],
                   ["assembled_item", "=",1],

               ]
           }
       })
        cur_frm.add_custom_button(__('Update Raw Materials'), () => {
				erpnext.utils.update_raw_items({
					frm: frm,
					child_docname: "raw_material",
					child_doctype: "Raw Material",
					cannot_add_row: false,
				})
			});
	}
})
cur_frm.cscript.update_available_stock = function () {
     frappe.call({
            method: "spreads.doc_events.quotation.set_available_qty",
            args: {
                items: cur_frm.doc.raw_material
            },
            callback: function (r) {
                var objIndex = 0
               for(var x=0;x<r.message.length;x+=1){
                    console.log("NAA")
                   objIndex = cur_frm.doc.raw_material.findIndex(obj => obj.name === r.message[x]['name'])

                    cur_frm.doc.raw_material[objIndex].available_qty = r.message[x]['available_qty']
                   cur_frm.refresh_field("raw_material")
               }
            }
        })
}
cur_frm.cscript.update_price_list = function () {
     frappe.call({
            method: "spreads.doc_events.quotation.update_price",
            args: {
                items: cur_frm.doc.raw_material ? cur_frm.doc.raw_material : [],
                price_list: cur_frm.doc.selling_price_list
            },
            callback: function (r) {
                var objIndex = 0
               for(var x=0;x<r.message.length;x+=1){
                    console.log("NAA")
                   objIndex = cur_frm.doc.raw_material.findIndex(obj => obj.name === r.message[x]['name'])

                    cur_frm.doc.raw_material[objIndex].rate = r.message[x]['rate']
                    cur_frm.doc.raw_material[objIndex].amount = r.message[x]['rate'] * r.message[x]['qty']
                   cur_frm.refresh_field("raw_material")
                   total_raw_material(cur_frm)
               }
            }
        })
}
frappe.ui.form.on('Raw Material', {
	service_item: function(frm, cdt, cdn) {
		update_service_item(cur_frm)
	},
    rate: function(frm, cdt, cdn) {
		var d = locals[cdt][cdn]
        d.amount = d.rate * d.qty
        cur_frm.refresh_field("raw_material")
        total_raw_material(cur_frm)
	},
    buying_price: function(frm, cdt, cdn) {
        total_raw_material(cur_frm)
	},
    qty: function (frm,cdt,cdn) {
    var d = locals[cdt][cdn]
        d.amount = d.rate * d.qty
        cur_frm.refresh_field("raw_material")
        total_raw_material(cur_frm)

    },
    item_code: function (frm,cdt, cdn) {

    var d = locals[cdt][cdn]
        if(d.item_code){

            frappe.call({
                method: "spreads.doc_events.quotation.get_rate",
                args: {
                    item_code: d.item_code,
                    warehouse: d.warehouse ? d.warehouse : "",
                    based_on: cur_frm.doc.rate_of_materials_based_on ? cur_frm.doc.rate_of_materials_based_on : "",
                   price_list: cur_frm.doc.selling_price_list ? cur_frm.doc.selling_price_list : ""

                },
                async: false,
                callback: function (r) {
                    console.log(r.message[0])
                    d.buying_price = r.message[1]
                    d.rate = r.message[0]
                    d.amount = r.message[0] * d.qty
                    d.available_qty = r.message[2]

                    cur_frm.refresh_field("raw_material")
                    total_raw_material(cur_frm)
                }
            })
    }

    },
    warehouse: function (frm,cdt, cdn) {
        var d = locals[cdt][cdn]
        if (d.item_code && d.warehouse) {

            frappe.call({
                method: "spreads.doc_events.quotation.get_rate",
                args: {
                    item_code: d.item_code,
                    warehouse: d.warehouse ? d.warehouse : "",
                    based_on: cur_frm.doc.rate_of_materials_based_on ? cur_frm.doc.rate_of_materials_based_on : "",
                    price_list: cur_frm.doc.selling_price_list ? cur_frm.doc.selling_price_list : ""

                },
                callback: function (r) {
                    d.buying_price = r.message[1]
                    d.rate = r.message[0]
                    d.amount = r.message[0] * d.qty
                    d.available_qty = r.message[2]
                    cur_frm.refresh_field("raw_material")
                    total_raw_material(cur_frm)
                }
            })
        }
    }
})

function update_service_item(cur_frm) {
    if(cur_frm.doc.docstatus === 0){
        console.log("NAA DIRI")
        for (var x = 0; x < cur_frm.doc.items.length; x += 1) {
            var total = 0
            for (var y = 0; y < cur_frm.doc.raw_material.length; y += 1) {
                if (cur_frm.doc.items[x].item_code === cur_frm.doc.raw_material[y].service_item) {
                    total += cur_frm.doc.raw_material[y].amount
                }
            }
            cur_frm.doc.items[x].rate = total
            cur_frm.doc.items[x].amount = total * cur_frm.doc.items[x].qty
            cur_frm.refresh_fields("items")
            compute_total(cur_frm)
        }
    }

}
function total_raw_material(cur_frm) {
    if(cur_frm.doc.docstatus === 0){
        var total = 0
        var total_buying = 0
        for(var x=0;x<cur_frm.doc.raw_material.length;x += 1){
            total += cur_frm.doc.raw_material[x].amount
            total_buying += (cur_frm.doc.raw_material[x].buying_price * cur_frm.doc.raw_material[x].qty)
        }
        cur_frm.doc.total_raw_material_expense = total
        cur_frm.doc.total_raw_material_buying_expense = total_buying
        cur_frm.doc.raw_material_profit = total - total_buying
        cur_frm.refresh_fields(["total_raw_material_expense","total_raw_material_buying_expense", "raw_material_profit"])
        total_expenses(cur_frm)
        update_service_item(cur_frm)
    }

}
function compute_total_submitted(cur_frm,data) {
    console.log("DATAAAAAAAAAAAAAAAAAA")
    console.log(data)
    if(data.length > 0){
        frappe.call({
        method: "erpnext.controllers.accounts_controller.update_child_qty_rate",
        args: {
            parent_doctype: "Sales Order",
            trans_items: data,
            parent_doctype_name: cur_frm.doc.name,
        },
        async: false,
        callback: function () {        }
    })
    }

}
function compute_total(cur_frm) {
    var total = 0
    $.each(cur_frm.doc.items || [], function(i, items) {
        total += items.amount
    });

    cur_frm.doc.total = total
    cur_frm.doc.grand_total = total - (cur_frm.doc.discount_amount ? cur_frm.doc.discount_amount : 0)
    cur_frm.doc.rounded_total =  cur_frm.doc.grand_total
    cur_frm.refresh_fields(['total','grand_total','rounded_total'])
}
cur_frm.cscript.raw_material_add = function (frm, cdt, cdn) {
    var d = locals[cdt][cdn]
    d.warehouse = warehouse
    cur_frm.refresh_field("raw_material")
}

cur_frm.cscript.update_serial_no = function () {
    frappe.call({
            method: "spreads.doc_events.quotation.update_serial_no",
            args: {
                items: cur_frm.doc.raw_material
            },
            callback: function (r) {
                var objIndex = 0
               for(var x=0;x<r.message.length;x+=1){
                    console.log("NAA")
                   objIndex = cur_frm.doc.raw_material.findIndex(obj => obj.name === r.message[x]['name'])

                    cur_frm.doc.raw_material[objIndex].serial_no = r.message[x]['serial_no']
                   cur_frm.refresh_field("raw_material")
               }
            }
        })
}
cur_frm.cscript.estimated_admin_expense = function () {
    total_expenses(cur_frm)
}
cur_frm.cscript.estimated_labor_expense = function () {
    total_expenses(cur_frm)
}
cur_frm.cscript.estimated_transportation_expense = function () {
    total_expenses(cur_frm)
}
cur_frm.cscript.estimated_other_expense = function () {
    total_expenses(cur_frm)
}
function total_expenses(cur_frm) {
    cur_frm.doc.estimated_total_expense = cur_frm.doc.total_raw_material_expense + cur_frm.doc.estimated_admin_expense + cur_frm.doc.estimated_labor_expense + cur_frm.doc.estimated_transportation_expense + cur_frm.doc.estimated_other_expense
    cur_frm.refresh_field("estimated_total_expense")
}