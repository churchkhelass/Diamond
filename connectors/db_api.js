var fs = require("fs");
const queries = require('../queries').get_query;
const RATE_PRECISION = 1000000;
const DEL_INCOMES_BALANCE_PCNT = 0.0005;
const DEBUG_WITH_DELETED = (process.env.DEBUG_WITH_DELETED === '1');

const DEV_MODE = (process.env.IS_DEV === '1') ? '_dev' : '';
// const HISTORICAL_TS_START = +(process.env.HISTORICAL_TS_START || '');

const { ClickHouse } = require('clickhouse');
const clickhouse_market = new ClickHouse({
    url: process.env.DB_HOST,
    port: process.env.DB_PORT,
    debug: false,
    basicAuth: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    },
    isUseGzip: true,
    config: {
        session_timeout                         : 60,
        output_format_json_quote_64bit_integers : 0,
        enable_http_compression                 : 0
    }
});

module.exports.get_datasources = async function (ts_start, ts_end){
    var query = queries('get_datasources.sql');
    let where = (ts_start && ts_end) ? `/nWHERE ts >= ${ts_start} AND ts < ${ts_end}`: '';
    query = query.replace(/{where}/g, where);
    let ret = [];
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) ret = res;
    } catch (error) {
        let e = fit_error(error);
        console.log('get_datasources : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.SaveArray = async function (rows, fquery) {
    var query = queries(fquery);
    return (await save_rows(query, rows));
}

async function save_rows(query, rows) {
    const ws = clickhouse_market.insert(query).stream();
    let res = null;
    try {
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            await ws.writeRow(row);
        }
        res = (await ws.exec());
    } catch (error) {
        let e = fit_error(error);
        // await utils.Logs.Put('ERROR', 'db_logs', 'save_rows', e);
        console.log(`ERR in db_logs.save_rows:, ${JSON.stringify(e)}\n${query}`);
    }
    return res;
}

function fit_error(err){
    let e = {
        code: err.code,
        message: err.message,
        stack: err.stack
    };
    return e;
}
