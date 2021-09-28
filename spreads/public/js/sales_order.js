var warehouse = ""

cur_frm.cscript.onload_post_render = function(){
    cur_frm.set_query('cost_center', () => {
        return {
            filters: {
                is_group: 0
            }
        }
    })
    cur_frm.set_query("item_code_raw_material", "raw_material", () => {
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
        name: cur_frm.doc.name
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

cur_frm.cscript.item_code_raw_material = function (frm,cdt, cdn) {

    var d = locals[cdt][cdn]
    if(d.item_code_raw_material){

        frappe.call({
            method: "spreads.doc_events.quotation.get_rate",
            args: {
                item_code: d.item_code_raw_material,
                warehouse: d.warehouse ? d.warehouse : "",
                based_on: cur_frm.doc.rate_of_materials_based_on ? cur_frm.doc.rate_of_materials_based_on : "",
                price_list: cur_frm.doc.price_list ? cur_frm.doc.price_list : ""

            },
            callback: function (r) {
                d.rate = r.message[0]
                d.amount = r.message[0] * d.qty_raw_material
                d.available_qty = r.message[1]

                cur_frm.refresh_field("raw_material")
            }
        })
    }

}
cur_frm.cscript.warehouse = function (frm,cdt, cdn) {
      var d = locals[cdt][cdn]
    if(d.item_code_raw_material && d.warehouse){

        frappe.call({
            method: "spreads.doc_events.quotation.get_rate",
            args: {
                item_code: d.item_code_raw_material,
                warehouse: d.warehouse ? d.warehouse : "",
                based_on: cur_frm.doc.rate_of_materials_based_on ? cur_frm.doc.rate_of_materials_based_on : "",
                price_list: cur_frm.doc.price_list ? cur_frm.doc.price_list : ""

            },
            callback: function (r) {
                d.rate = r.message[0]
                d.amount = r.message[0] * d.qty_raw_material
                d.available_qty = r.message[1]
                cur_frm.refresh_field("raw_material")
            }
        })
    }
}

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
cur_frm.cscript.qty_raw_material = function (frm,cdt,cdn) {
    var d = locals[cdt][cdn]

    if(d.qty_raw_material && d.qty_raw_material <= d.available_qty){
        d.amount = d.rate * d.qty_raw_material
        cur_frm.refresh_field("raw_material")
    } else {
        var qty = d.qty_raw_material
        d.qty_raw_material = d.available_qty
        d.amount = d.rate * d.available_qty
        cur_frm.refresh_field("raw_material")
        frappe.throw("Not enough stock. Can't change to " + qty.toString())

    }
}

cur_frm.cscript.raw_material_add = function (frm, cdt, cdn) {
    var d = locals[cdt][cdn]
    d.warehouse = warehouse
    cur_frm.refresh_field("raw_material")
}
