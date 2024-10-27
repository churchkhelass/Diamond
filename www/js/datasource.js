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

    $('#openBtn').click(function() {
        $('#csvFileInput').click();
    });
    $('#csvFileInput').change(function(event) {
        const file = event.target.files[0];
        if (file) {
            $('#upload_name').html(file.name);
        }
    });

    $('#uploadBtn').click(function() {
        const fileInput = $('#csvFileInput')[0];
        if (fileInput.files.length === 0) {
            alert("Please select a CSV file first.");
            return;
        }
        if ($('#upload_tbl_name').val().length === 0) {
            alert("Please name TBL DataSource");
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(event) {
            const csvContent = event.target.result;

            // Отправка файла на серверное API
            $.ajax({
                url: '/upload_csv',
                type: 'POST',
                data: { tbl_name: $('#upload_tbl_name').val(), csvData: csvContent },
                success: function(response) {
                    console.log("File uploaded successfully:", response);
                },
                error: function(xhr, status, error) {
                    console.error("File upload failed:", error);
                }
            });
        };

        // Чтение файла как текста
        reader.readAsText(file);
    });
});
