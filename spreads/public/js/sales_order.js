cur_frm.cscript.onload_post_render = function(){

       cur_frm.set_query('project_code', () => {
        return {
            filters: {
                is_group: 0
            }
        }
    })
}