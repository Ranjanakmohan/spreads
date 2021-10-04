

cur_frm.cscript.onload_post_render = function () {
    cur_frm.set_query("item_code_raw_material", "raw_material", () => {
            return {
                    filters: {
                        is_stock_item: 1
                }

            }
        })
}
