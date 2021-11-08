// Copyright (c) 2021, jan and contributors
// For license information, please see license.txt

frappe.ui.form.on('BOM Item Template', {
	refresh: function(frm) {
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