`use strict`

$(document).ready( function () {
    let a = $('a[name="a-datasource"]');
    a.attr('href', '#');
    a.toggleClass('active');

    $('#save').click(function() {
        let data_name = $("#name").val();
        let data_desc = $("#description").val();
        alert (`${data_name} : ${data_desc}`);
        $.ajax({
            type: "POST",
            url: "/datasource/save",
            data: JSON.stringify({
                name : data_name,
                sql : data_desc
            }),
            dataType: "json",
            contentType : "application/json;charset=utf-8",
            success: async function(data) {
                location.href='/reports';
            },
            error: function(data) {
                console.log(data);
            }
        });
    });
});
