

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
