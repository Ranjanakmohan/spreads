cur_frm.cscript.onload_post_render = function(){

       cur_frm.set_query('project_code', () => {
        return {
            filters: {
                is_group: 0
            }
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