const axios = require('axios');
const IS_DEV = +process.env.IS_DEV || 0;
const DEBUG = (+(process.env.DEBUG || '') === 1);
const ACCOUNTS = JSON.parse((process.env.ACCOUNTS || '[]'));

function getBotUrl(account) {
    let local_account = ACCOUNTS.find(c => c.name === account);
    if (local_account) return local_account.api_url;
    else return (DEBUG)
    ? `http://127.0.0.1:8080/api/v1/namespaces/trading${IS_DEV ? '-dev':''}/services/svc-${account.toLowerCase()}/proxy`
    : `http://svc-${account}:80`;
}

module.exports.recharge = async function (account, dt_start, dt_end) {
    let ret = 0;
    try {
        let url = `${getBotUrl(account)}/recharge_incomes?dt_start=${dt_start}&dt_end=${dt_end}`;
        let {data} = await axios.get(url);
        let msg = (data && data.result && data.result.msg) ? data.result.msg : '';
        let match = msg.match(/\((\d+)\)/);
        if (match) ret = parseInt(match[1]);
    } catch (error) {
        console.log('GET CONFIG ERROR:',error.message,account);
    }
    return ret;
}

function DT(ts, date_only) {
    let iso = (new Date(ts)).toISOString();
    return (date_only) ? `${iso.substring(0, 10)}` : `${iso.replace(/T/g, ' ').substring(0, 19)}`;
}