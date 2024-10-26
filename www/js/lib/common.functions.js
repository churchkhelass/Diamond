let _modal_Promise = Promise.resolve();
let _modal_Resolve = null;

$(document).ready( function () {
    // const _popup_alert = $(".popup.popup_share.js-popup.js-popup-alert");
    const _modal_alert_open   = document.getElementById("div-alert-open");
    const _btn_alert_close    = document.getElementById("btn-alert-close");
    const _modal_confirm_open = document.getElementById("div-confirm-open");
    const _btn_confirm_close  = document.getElementById("btn-confirm-close");
    const _btn_confirm_ok     = document.getElementById("btn-confirm-ok");

    _btn_alert_close.addEventListener("click", function (e) {
        e.preventDefault();
        _exit_popup(_modal_alert_open, true);
    });

    _btn_confirm_close.addEventListener("click", function (e) {
        e.preventDefault();
        _exit_popup(_modal_confirm_open, false);
    });

    _btn_confirm_ok.addEventListener("click", function (e) {
        e.preventDefault();
        _exit_popup(_modal_confirm_open, true);
    });

    _modal_alert_open.addEventListener("open", function () {
        $(_modal_alert_open).addClass("animation").addClass("visible");
        _modal_Promise = _modal_Promise.then(() => {
            return new Promise((resolve) => {
                _modal_Resolve = resolve;
            });
        });
    });

    _modal_confirm_open.addEventListener("open", function () {
        $(_modal_confirm_open).addClass("animation").addClass("visible");
        _modal_Promise = _modal_Promise.then(() => {
            return new Promise((resolve) => {
                _modal_Resolve = resolve;
            });
        });
    });

    function _exit_popup(_modal_div, param) {
        $(_modal_div).removeClass('animation');

        if ($('.js-popup.visible').length == 1) {
            $('body').removeClass('no-scroll');
            $('body').css('padding-right', 0);
        }

        setTimeout(function () {
            $(_modal_div).removeClass('visible');
        }, 300);

        if (_modal_Resolve) {
            _modal_Resolve(param);
            _modal_Resolve = null;
        }
    }
});

async function nice_alert(msg,newLines = false,hasUrl = false,url = undefined) {
    let _msg = (typeof msg === 'string') ? msg : (typeof msg === 'object') ? JSON.stringify(msg) : 'Oops!';
    if (newLines === true)
        _msg = _msg.replace(/\n/g,'<br>');
    if (hasUrl === true) {
        _msg = _msg.replace('{URL}',`<a href="${url}`).replace('{URL_END}',`">${url}</a>`)
    }

    $("#div-alert-open").find('h3').html(_msg);
    document.getElementById("div-alert-open").dispatchEvent(new Event("open"));
    await _modal_Promise;
}

async function nice_confirm(msg,newLines = false) {
    let _msg = (typeof msg === 'string') ? msg : (typeof msg === 'object') ? JSON.stringify(msg) : 'Oops!';
    if (newLines === true)
        _msg = _msg.replace(/\n/g,'<br>');
    $("#div-confirm-open").find('h3').html(_msg);
    document.getElementById("div-confirm-open").dispatchEvent(new Event("open"));
    return (await _modal_Promise);
}
