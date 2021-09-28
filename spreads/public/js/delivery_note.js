cur_frm.cscript.onload = function () {
    if(cur_frm.doc.is_return){
        $.each(cur_frm.doc.raw_material, function(i, row) {
			row.qty_raw_material = 0 - row.qty_raw_material
            row.amount = row.qty_raw_material * row.rate
            cur_frm.refresh_field("raw_material")
		})
    }
}
cur_frm.cscript.onload_post_render = function () {
    cur_frm.set_query("item_code_raw_material", "raw_material", () => {
            return {
                    filters: {
                        is_stock_item: 1
                }

            }
        })

}
cur_frm.cscript.refresh = function (frm,cdt, cdn) {
  cur_frm.trigger("filter_service_item")
}
frappe.ui.form.on("Delivery Note Item", {
	item_code: function(frm, dt, dn) {
		  cur_frm.trigger("filter_service_item")
	}
});
cur_frm.cscript.filter_service_item = function () {
      var items=[]
    if(cur_frm.doc.items){
        items = cur_frm.doc.items.map(x => x.is_service_item ? x.item_code : "")
    }
    console.log("REFRESH ITEMS")
    console.log(items)
    cur_frm.set_query('service_item', 'raw_material', () => {
    return {
        filters: [
            ["name", "in", items]
        ]
    }
    })
}