

cur_frm.cscript.onload_post_render = function () {
    cur_frm.set_query("item_code_raw_material", "raw_material", () => {
            return {
                    filters: {
                        is_stock_item: 1
                }

            }
        })
       $('input[data-fieldname="total_raw_material_expense"]').css("border","3px solid blue")

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
                    price_list: cur_frm.doc.price_list ? cur_frm.doc.price_list : ""

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
                price_list: cur_frm.doc.price_list ? cur_frm.doc.price_list : ""

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