`use strict`

$(document).ready( function () {
    let a = $('a[name="a-report"]');
    a.attr('href', '#');
    a.toggleClass('active');

    $.ajax({
        type: "GET",
        url: `/report/get_datasources`,
        dataType: "json",
        contentType : "application/json;charset=utf-8",
        success: function(data) {
            console.log(`data length === ${data.length}`);
        },
        error: function(data) {
          console.log(data);
        }
    });
});
