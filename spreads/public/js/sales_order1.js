cur_frm.cscript.generate_project_id = function(){
    frappe.call({
        method: "spreads.doc_events.sales_order.generate_cc",
        args: {
            name: cur_frm.doc.name,
            customer: cur_frm.doc.customer_name
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