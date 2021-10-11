cur_frm.cscript.is_stock_item = function(){
    console.log("WHAAAAT")
    cur_frm.doc.assembled_item = false
    cur_frm.refresh_field("assembled_item")
}
cur_frm.cscript.assembled_item = function(){
    console.log("KASNDKASND")
    cur_frm.doc.is_stock_item = false
    cur_frm.refresh_field("is_stock_item")
}

cur_frm.cscript.item_group = function () {
    if(cur_frm,doc.item_group){
        frappe.db.get_doc('Item Group', cur_frm.doc.item_group)
            .then(doc => {
                cur_frm.doc.is_stock_item = doc.is_maintain_stock
                cur_frm.doc.is_sales_item = doc.is_sales_item
                cur_frm.doc.is_purchase_item = doc.is_purchase_item
                cur_frm.doc.is_fixed_asset = doc.is_fixed_asset
                cur_frm.doc.is_service_item = doc.is_service_item
                cur_frm.doc.has_serial_no = doc.has_serial_no
                cur_frm.refresh_field("is_stock_item")
                cur_frm.refresh_field("is_sales_item")
                cur_frm.refresh_field("is_purchase_item")
                cur_frm.refresh_field("is_fixed_asset")
                cur_frm.refresh_field("is_service_item")
                cur_frm.refresh_field("has_serial_no")
            })
    }

}