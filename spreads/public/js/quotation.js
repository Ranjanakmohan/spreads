var warehouse = ""
cur_frm.cscript.generate_item_template = function () {
    let d = new frappe.ui.Dialog({
        title: 'Enter details',
        fields: [
            {
                label: 'Description',
                fieldname: 'description',
                fieldtype: 'Data',
                reqd: 1
            }
        ],
        primary_action_label: 'Submit',
        primary_action(values) {
            console.log(values)
            frappe.call({
                method: "spreads.doc_events.quotation.generate_item_templates",
                args: {
                    items: cur_frm.doc.items,
                    raw_materials: cur_frm.doc.raw_material,
                    description: values.description
                },
                async: false,
                callback: function (r) {
                        frappe.show_alert({
                            message:__('BOM Item Template Created'),
                            indicator:'green'
                        }, 3);
                }
            })
            d.hide();
        }
    });

    d.show();

}
cur_frm.cscript.item_templates = function () {
    var d = new frappe.ui.form.MultiSelectDialog({
        doctype: "BOM Item Template",
        target: this.cur_frm,
        setters: {
            description: null
        },
        add_filters_group: 1,
        date_field: "posting_date",
        get_query() {
            return {
                filters: { docstatus: ['!=', 2] }
            }
        },
        action(selections) {
            console.log(d)

            get_template(selections, cur_frm)
            d.dialog.hide()
        }
    });
}
function get_template(template_names, cur_frm){
     frappe.call({
        method: 'spreads.doc_events.quotation.get_templates',
        args: {
            doc: cur_frm.doc,
            templates: template_names
        },
        freeze: true,
        freeze_message: "Get Templates...",
        async:false,
        callback: function(r){
            if(cur_frm.doc.items.length > 0 && !cur_frm.doc.items[0].item_code){
                cur_frm.clear_table("items")
                cur_frm.refresh_field("items")
            }
            for(var x=0;x<r.message[0].length;x+=1){
                if(!check_items(r.message[0][x], cur_frm, "items")) {
                    cur_frm.add_child("items", r.message[0][x])
                    cur_frm.refresh_field("items")
                }
            }
            for(var xx=0;xx<r.message[1].length;xx+=1){
                if(!check_items(r.message[1][xx], cur_frm, "raw_material")) {
                    cur_frm.add_child("raw_material", r.message[1][xx])
                    cur_frm.refresh_field("raw_material")
                }
            }
            update_service_item(cur_frm)
             total_raw_material(cur_frm)
        }
    })
}
function check_items(item, cur_frm,table) {
    if(cur_frm.doc[table]){
        for(var x=0;x<cur_frm.doc[table].length;x+=1){
            var item_row = cur_frm.doc[table][x]
            if(item_row.item_code === item.item_code && item_row.service_item === item.service_item){
                item_row.qty += item.qty
                item_row.amount = item_row.qty * item_row.rate
                cur_frm.refresh_field(table)
                return true
            }
        }
        return false
    }

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
frappe.ui.form.on('Quotation', {
    selling_price_list: function () {
        if(cur_frm.doc.selling_price_list){
             console.log("SELLING PRICE LIST")
      cur_frm.trigger("update_price_list")
        }

    },
	refresh: function(frm) {
		cur_frm.fields_dict["raw_material"].grid.add_custom_button(__('Update Available Stock'),
			function() {
				cur_frm.trigger('update_available_stock')
        });
        cur_frm.fields_dict["raw_material"].grid.grid_buttons.find('.btn-custom').removeClass('btn-default').addClass('btn-primary');


         cur_frm.fields_dict["items"].grid.add_custom_button(__('Generate Item Template'),
            function() {
                cur_frm.trigger("generate_item_template")
            }).css('background-color','#CCCC00').css('margin-left','10px').css('font-weight','bold')

        cur_frm.fields_dict["items"].grid.add_custom_button(__('From Template'),
			function() {
	        cur_frm.trigger("item_templates")
        }).css('background-color','brown').css('color','white').css('font-weight','bold')
        cur_frm.set_query("service_item", "raw_material", ()=>{
           var names = Array.from(cur_frm.doc.items, x => "item_code" in x ? x.item_code:"")
           return {
               filters: [
                   ["name", "in",names]
               ]
           }
       })
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
    if(d.item_code && d.warehouse){

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
function total_raw_material(cur_frm) {
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
cur_frm.cscript.product_bundle = function (frm,cdt,cdn) {
    if(cur_frm.doc.product_bundle){
        cur_frm.clear_table("raw_material")
        cur_frm.refresh_field("raw_material")
        frappe.db.get_doc('Product Bundle', cur_frm.doc.product_bundle)
            .then(doc => {
               for(var x=0;x<doc.items.length;x+=1){
                    cur_frm.add_child('raw_material', {
                        item_code: doc.items[x].item_code,
                        qty: doc.items[x].qty
                    });

                    cur_frm.refresh_field('raw_material');

               }
            })
    }
}
cur_frm.cscript.onload_post_render = function (frm,cdt, cdn) {
       $('input[data-fieldname="total_raw_material_expense"]').css("border","3px solid blue")

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

cur_frm.cscript.raw_material_add = function (frm, cdt, cdn) {
    var d = locals[cdt][cdn]
    d.warehouse = warehouse
    cur_frm.refresh_field("raw_material")
}
cur_frm.cscript.estimated_admin_expense = function () {
    console.log("test")
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

function update_service_item(cur_frm) {
    console.log("asd")
    for(var x=0;x<cur_frm.doc.items.length;x+=1){
        var total = 0
        for(var y=0;y<cur_frm.doc.raw_material.length;y+=1){
            if(cur_frm.doc.items[x].item_code === cur_frm.doc.raw_material[y].service_item){
                total += cur_frm.doc.raw_material[y].amount
            }
        }
        cur_frm.doc.items[x].rate = total
        cur_frm.doc.items[x].amount = total * cur_frm.doc.items[x].qty
        cur_frm.refresh_fields("items")
    }
    compute_total(cur_frm)
}
function compute_total(cur_frm) {
    var total = 0
    $.each(cur_frm.doc.items || [], function(i, items) {
        total += items.amount
    });
    cur_frm.doc.total = total
    cur_frm.doc.grand_total = total - (cur_frm.doc.discount_amount ? cur_frm.doc.discount_amount : 0)
    cur_frm.doc.rounded_total =  cur_frm.doc.grand_total
    cur_frm.refresh_fields(["total",'grand_total','rounded_total'])
}