cur_frm.cscript.refresh = function(){

       cur_frm.set_query('project_code', () => {
        return {
            filters: {
                is_group: 0
            }
        }
    })
}