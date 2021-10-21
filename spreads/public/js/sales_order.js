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
frappe.ui.form.on('Sales Order', {
	refresh: function(frm) {
		cur_frm.fields_dict["raw_material"].grid.add_custom_button(__('Update Available Stock'),
			function() {
				cur_frm.trigger('update_available_stock')
        });
        cur_frm.fields_dict["raw_material"].grid.grid_buttons.find('.btn-custom').removeClass('btn-default').addClass('btn-primary');

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
frappe.ui.form.on('Raw Material', {
	rate: function(frm, cdt, cdn) {
		var d = locals[cdt][cdn]

        d.amount = d.rate * d.qty
        cur_frm.refresh_field("raw_material")
        total_raw_material(cur_frm)
	},
    qty: function (frm,cdt,cdn) {
    var d = locals[cdt][cdn]

        d.amount = d.rate * d.qty
        cur_frm.refresh_field("raw_material")
        total_raw_material(cur_frm)

    },
    warehouse: function (frm,cdt, cdn) {
      var d = locals[cdt][cdn]
    if(d.item_code && d.warehouse){

        frappe.call({
            method: "spreads.doc_events.quotation.get_rate",
            args: {
                item_code: d.item_code,
                warehouse: d.warehouse ? d.warehouse : "",
                based_on: cur_frm.doc.rate_of_materials_based_on ? cur_frm.doc.rate_of_materials_based_on : "",
                price_list: cur_frm.doc.price_list ? cur_frm.doc.price_list : ""

            },
            callback: function (r) {
                d.rate = r.message[0]
                d.amount = r.message[0] * d.qty
                d.available_qty = r.message[1]
                cur_frm.refresh_field("raw_material")
            }
        })
    }
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
                price_list: cur_frm.doc.price_list ? cur_frm.doc.price_list : ""

            },
            callback: function (r) {
                d.rate = r.message[0]
                d.amount = r.message[0] * d.qty
                d.available_qty = r.message[1]

                cur_frm.refresh_field("raw_material")
            }
        })
    }

}
})
function total_raw_material(cur_frm) {
    var total = 0
    for(var x=0;x<cur_frm.doc.raw_material.length;x += 1){
        total += cur_frm.doc.raw_material[x].amount
    }
    cur_frm.doc.total_raw_material_expense = total
    cur_frm.refresh_field("total_raw_material_expense")
    total_expenses(cur_frm)
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