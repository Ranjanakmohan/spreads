// Copyright (c) 2021, jan and contributors
// For license information, please see license.txt
var warehouse = ''
frappe.ui.form.on('BOM Item Template', {
	refresh: function(frm) {
	     frappe.db.get_single_value('Stock Settings', 'default_warehouse')
            .then(ans => {
                warehouse = ans
            })
	    cur_frm.set_query("item_code", "items", ()=>{
           return {
               filters: {
                   assembled_item: 1
               }
           }
       })
        cur_frm.set_query("item_code", "raw_material", ()=>{
           return {
               filters: {
                   is_stock_item: 1,
               }
           }
       })
       cur_frm.set_query("service_item", "raw_material", ()=>{
           var names = Array.from(cur_frm.doc.items, x => "item_code" in x ? x.item_code:"")
           return {
               filters: [
                   ["name", "in",names]
               ]
           }
       })
	}

});

frappe.ui.form.on('Raw Material', {
	item_code: function(frm, cdt, cdn) {
	    var d = locals[cdt][cdn]
        if(d.item_code){
	        frappe.call({
                method: "spreads.doc_events.quotation.get_rate",
                args:{
                    item_code: d.item_code,
                    warehouse: d.warehouse ? d.warehouse : "",
                    based_on: "",
                    price_list: "Standard Selling"
                },
                callback: function (r) {
                    d.rate = r.message[0]
                     d.available_qty = r.message[1]
                    cur_frm.refresh_field(d.parentfield)
                }
            })
        }

	},
    raw_material_add: function (frm, cdt, cdn) {
        var d = locals[cdt][cdn]
        d.warehouse = warehouse
        if(cur_frm.doc.items.length > 0){
            d.service_item = cur_frm.doc.items[0].item_code
        }
        cur_frm.refresh_field("raw_material")
    }
});