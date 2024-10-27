`use strict`

$(document).ready( function () {
    let a = $('a[name="a-reports"]');
    a.attr('href', '#');
    a.toggleClass('active');

    var TABLE = $('#tbl_reports').DataTable({
        bFilter: false,
        rowReorder: true,
        paging: false,
        info: false,
        searching: false,
        columns: [
            { orderable: false, className: "ta-left", data: 'name' },
            { orderable: true, className: "ta-right", data: 'desc' }
        ]
    });

    $('#tbl_reports tbody').on('click', 'tr', function () {
        // Получение данных строки
        let rowData = TABLE.row(this).data();
    
        // Проверка и доступ к полю name
        if (rowData) {
            let name = rowData.name;
            setCookie('report_name', name, { path: '/', expires: new Date(Date.now() + 10000) });
            location.href=`/viewer/report`;
        }
    });

    $.ajax({
        type: "GET",
        url: `/reports/get_reports`,
        dataType: "json",
        contentType : "application/json;charset=utf-8",
        success: function(data) {
            TABLE.clear();
            TABLE.rows.add(data);
            TABLE.draw();
        },
        error: function(data) {
        console.log(data);
        }
    });

});
