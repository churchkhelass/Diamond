`use strict`

$(document).ready( function () {
    let a = $('a[name="a-onepage"]');
    a.attr('href', '#');
    a.toggleClass('active');
});