`use strict`

$(document).ready( function () {
    const report_name = getCookie('report_name');
    $('#report_name').html(report_name);

    $.ajax({
        type: "GET",
        url: `/viewer/get_report?report_name=${encodeURIComponent(report_name)}`,
        dataType: "json",
        contentType : "application/json;charset=utf-8",
        success: function(response) {
            $('#report_name').html(response.desc);
            let cols = Object.keys(response.data[0]);
            const columns = cols.map(col => ({ title: col, data: col }));
            const data = response.data;
            $('#tbl_report').DataTable({
                data: data,
                columns: columns,
                destroy: true,  // Позволяет перезаписать таблицу, если она уже инициализирована
                bFilter: false,
                paging: false,
                info: false
            });
        },
        error: function(data) {
        console.log(data);
        }
    });
});