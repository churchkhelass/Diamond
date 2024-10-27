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

module.exports.get_datasources = get_datasources;
async function get_datasources (ts_start, ts_end){
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

module.exports.get_reports = async function (ts_start, ts_end){
    var query = queries('get_reports.sql');
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

module.exports.get_report = async function (report_name){
    var query = queries('get_report_meta.sql');
    query = query.replace(/{report_name}/g, report_name);
    let ret = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) {
            let datasource_name = res[0].datasource_name;
            let fields = JSON.parse((res[0].fields).replace(/'/g, '"'));
            ret = { report_name, desc: res[0].desc, data: null };
            let _query = queries('get_datasource_query.sql');
            _query = _query.replace(/{name}/g, datasource_name);
            let _res = await clickhouse_market.query(_query).toPromise();
            if (_res.length > 0) {
                let sql = _res[0].query;
                let _query = `SELECT ${fields.map(c => '`'+c+'`').join(', ')} FROM ( ${sql} ) LIMIT 100`;
                let __res = await clickhouse_market.query(_query).toPromise();
                if (__res.length > 0) {
                    ret.data = __res;
                }

            }
        }
    } catch (error) {
        let e = fit_error(error);
        console.log('get_datasources : ', JSON.stringify(e));
    }
    return ret;
}

// get_columns
module.exports.get_columns = async function (name){
    var query = queries('get_datasource_query.sql');
    query = query.replace(/{name}/g, name);
    let ret = [];
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) {
            let _query = `SELECT * FROM ( ${res[0].query} ) LIMIT 1`;
            let _res = await clickhouse_market.query(_query).toPromise();
            if (_res.length > 0) {
                ret = Object.keys(_res[0]).map(c => ({ name: c, check: '' }));
            }
        }
    } catch (error) {
        let e = fit_error(error);
        console.log('get_datasources : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.CreateTableAndSave = async function (tbl_name, data) {
    var query = queries(`create_table.sql`);
    let keys = Object.keys(data[0]);
    let formattedKeys = keys.map(key => `\`${key}\` String`);
    let formattedKeys2 = keys.map(key => `\`${key}\``);
    let columns = formattedKeys.join(',\n');
    let columns2 = formattedKeys2.join(',');
    query = query.replace(/{tbl_name}/g, tbl_name).replace(/{columns}/g, columns);
    let res = null;
    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        if (_res) {
            let valuesArray = data.map(item => keys.map(key => item[key]));
            let insert_table_query = `INSERT INTO db_diamond.${tbl_name} (${columns2})`;
            await save_rows(insert_table_query, valuesArray);
            res = true;
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'Create', tbl, error: JSON.stringify(e)};
        console.log('ERR in db.Create:', JSON.stringify(msg));
    }
    return res;
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
