

cur_frm.cscript.onload = function () {
    if(cur_frm.doc.is_return){
        $.each(cur_frm.doc.raw_material, function(i, row) {
			row.qty_raw_material = 0 - row.qty_raw_material
            row.amount = row.qty_raw_material * row.rate
            cur_frm.refresh_field("raw_material")
		})
    }
}