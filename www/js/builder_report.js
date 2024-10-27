`use strict`

$(document).ready( function () {
    let a = $('a[name="a-report"]');
    a.attr('href', '#');
    a.toggleClass('active');

    $('#btn-save').on('click', function() {
        const selectedValue = $('#datasource-select').val();
        if (selectedValue && selectedValue !== '' && $('#datasource-select').val() !== 'NONE') {
            // 
            let report_name = $('#report_name').val();
            let report_desc = $('#report_desc').val();
            let sel = $('#datasource-select').val();
            if (report_name && report_name !== '' && report_desc && report_desc !== '' && sel !== 'NONE') {
                let checkedFields = [];

                TABLE.rows().every(function() {
                    // `this.node()` - это DOM-узел текущей строки
                    let rowNode = $(this.node());
                    let checkbox = rowNode.find('input[type="checkbox"]');

                    // Проверка, установлен ли чекбокс
                    if (checkbox.is(':checked')) {
                        // Если установлен, добавляем данные строки в массив
                        checkedFields.push(this.data());
                    }
                });
                if (checkedFields.length > 0) {
                    $.ajax({
                        // TODO save report
                        type: "POST",
                        url: `/report`,
                        data: JSON.stringify({
                            name : report_name,
                            desc : report_desc,
                            datasource_name: sel,
                            fields : checkedFields.map(c => c.name)
                        }),
                        dataType: "json",
                        contentType : "application/json;charset=utf-8",
                        success: function(data) {
                            location.href='/reports';
                        },
                        error: function(data) {
                            console.log(data);
                        }
                    });
                }
            }
        }
        else TABLE.clear().draw();
    });

    $('#datasource-select').niceSelect();
    $('#datasource-select').on('change', function() {
        const selectedValue = $(this).val();
        if (selectedValue !== 'NONE') {
            $.ajax({
                type: "GET",
                url: `/report/get_columns?name=${selectedValue}`,
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
        }
        else TABLE.clear().draw();
    });

    var TABLE = $('#tbl_datasource').DataTable({
        bFilter: false,
        rowReorder: true,
        paging: false,
        info: false,
        searching: true,
        columns: [
            { orderable: false, className: "ta-left", data: 'check' },
            { orderable: true, className: "ta-right", data: 'name' }
        ],
        rowCallback: function( row, data, displayNum ) {
            $('td:eq(0)', row).html(check_template);
        }
    });

    $.ajax({
        type: "GET",
        url: `/report/get_datasources`,
        dataType: "json",
        contentType : "application/json;charset=utf-8",
        success: function(data) {
            // TABLE.clear();
            // // let data_arr = data.map(c => [c.check, c.name]);
            // TABLE.rows.add(data);
            // TABLE.draw();
            $('#datasource-select').empty();
            $('#datasource-select').append(`<option value="NONE">Not Selected</option>`);
            for (let ci = 0; ci < data.length; ci++) {
                const c = data[ci];
                $('#datasource-select').append(`<option value="${c.name}">${c.name}</option>`);
            }
            $('#datasource-select').niceSelect('update');

        },
        error: function(data) {
          console.log(data);
        }
    });
});

var check_template = `<label class="checkbox">
  <input class="checkbox__input" class="styled-checkbox" type="checkbox" autocomplete="off" checked>
  <span class="checkbox__inner">
    <span class="checkbox__tick"></span>
  </span>
</label>`;
