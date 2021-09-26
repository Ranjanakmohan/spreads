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