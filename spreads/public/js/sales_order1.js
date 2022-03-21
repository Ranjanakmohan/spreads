
frappe.ui.form.on("Sales Order", {
    refresh: function(frm, cdt, cdn) {
        cur_frm.add_custom_button(__('MR for Raw Materials'), () => cur_frm.trigger("mr_material_request"), __('Create'));
        // cur_frm.add_custom_button(__('Custom Sales Invoice'), () => cur_frm.trigger("make_sales_invoice"), __('Create'));
        // cur_frm.add_custom_button(__('Custom Delivery Note'), () => cur_frm.trigger("make_delivery_note_based_on_delivery_date"), __('Create'));

    },
    mr_material_request: function() {
		frappe.model.open_mapped_doc({
			method: "spreads.doc_events.sales_order.make_mr",
			frm: cur_frm
		})
    },
})

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