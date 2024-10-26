var fs = require("fs");
const queries = require('./../queries').get_query;
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

module.exports.getIncomesLogsByDays = async function () {
    let where_deleted = (DEBUG_WITH_DELETED) ? '' : '\nWHERE deleted = 0';
    var query = queries('get_incomes_logs_by_days.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{where_deleted}/g, where_deleted);
    let ret = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) ret = res.reduce((a,c,i) => {
            if (!a[c.account]) a[c.account] = [{ts_start: c.tss, ts_end: c.tss_end, dt_start: c.dt_start, dt_end: c.dt_end}];
            else {
                let curr = a[c.account][a[c.account].length-1];
                if (curr.ts_end === c.tss) {
                    curr.ts_end = c.tss_end;
                    curr.dt_end = c.dt_end;
                }
                else a[c.account].push({ts_start: c.tss, ts_end: c.tss_end, dt_start: c.dt_start, dt_end: c.dt_end});
            }
            return a;
        }, {});
    } catch (error) {
        console.log('GetAccountID : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetStartCorrectTss = async function (){
    var query = queries('get_start_tss_last_correct.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE);
    let ret = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) ret = res.reduce((a,c) => {
            a[c.account_id] = c.tss_last_correct;
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetAccountID : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetAccountID = async function (account){
    let deleted = (DEBUG_WITH_DELETED) ? '' : ' AND deleted = 0';
    var query = queries('get_account_id.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{account}/g, account).replace(/{deleted}/g, deleted);
    let account_id = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) account_id = res[0].account_id;
    } catch (error) {
        let e = fit_error(error);
        console.log('GetAccountID : ', JSON.stringify(e));
    }
    return account_id;
}

module.exports.GetLiqTmp = async function (){
    var query = queries('get_liq_tmp.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE);
    let liqs = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) liqs = res;
    } catch (error) {
        let e = fit_error(error);
        console.log('GetLiqTmp : ', JSON.stringify(e));
    }
    return liqs;
}

module.exports.GetLiqAssetsTmp = async function (account, ts){
    var query = queries('get_liq_assets_tmp.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{account}/g, account).replace(/{ts}/g, ts);
    let liqs = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) liqs = res;
    } catch (error) {
        let e = fit_error(error);
        console.log('GetLiqTmp : ', JSON.stringify(e));
    }
    return liqs;
}

module.exports.SetLiqTmp = async function (account, ts, un_pnl){
    var query = queries('set_liq_tmp.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{account}/g, account)
    .replace(/{ts}/g, ts).replace(/{un_pnl}/g, un_pnl);
    let liqs = false;
    try {
        await clickhouse_market.query(query).toPromise();
        liqs = true;
    } catch (error) {
        let e = fit_error(error);
        console.log('SetLiqTmp : ', JSON.stringify(e));
    }
    return liqs;
}

module.exports.update = async function (tbl, upd_obj, where_obj) {
    try {
        let _set = Object.keys(upd_obj)
        .map(c => `${c} = ${(upd_obj[c].to_quote) ? "'" + upd_obj[c].value + "'" : upd_obj[c].value}`)
        .join(', ');
        let _where = Object.keys(where_obj)
        .map(c => `${c} ${where_obj[c].sign} ${(where_obj[c].to_quote) ? "'" + where_obj[c].value + "'" : where_obj[c].value}`)
        .join(' AND ');

        var query = queries('update.sql');
        query = query.replace(/{dev_mode}/g, DEV_MODE)
        .replace(/{tbl}/g, tbl).replace(/{set}/g, _set).replace(/{where}/g, _where);

        await clickhouse_market.query(query).toPromise();
    } catch (error) {
        let e = fit_error(error);
        console.log(`update ${tbl}: `, JSON.stringify(e));
    }
}

module.exports.get_logs_raw = async function(acc_name, symbols, is_silent) {
    let res = null;
    let where = '';
    if (symbols) {
        let _symbols = symbols.split(',').map(c => c.trim()).filter(c => c.length > 0);
        if (_symbols && _symbols.length > 0) where = ` AND symbol IN (${_symbols.map(c => `'${c}'`).join(',')})`;
    }
    // var query = fs.readFileSync(process.cwd()+'/queries/take_logs_for_poses.sql','utf-8');
    var query = queries('take_logs_for_poses.sql');
    query = query.replaceAll(/{dev_mode}/g, DEV_MODE).replaceAll(/{acc_name}/g, acc_name)
    .replaceAll(/{where}/g, where);

    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        if (_res && _res.length > 0) {
            let li = 0;
            let log = _res[li];
            res = {ts: Number.MAX_VALUE, logs: {}, ts_end: 0};

            if (res.ts > log.ts) res.ts = log.ts;
            if (res.ts_end < log.ts) res.ts_end = log.ts;
            if (!res.logs[log.symbol]) res.logs[log.symbol] = [];
            res.logs[log.symbol].push({
                ts: log.ts, strat_id: log.st, action: log.act, level: log.level, side: log.side,
                price: log.price, amount: log.amount, pnl: log.pnl, commission: log.commission,
                enter_exit: log.enter_exit, pos_mode: log.pos_mode, tp: log.tp, sl: log.sl
            });
            li++;

            for (; li < _res.length; li++) {
                let log_prev = log;
                log = _res[li];
                if (
                    log.ts_ === log_prev.ts_
                    && log.symbol === log_prev.symbol
                    && log.act === log_prev.act
                    && log.level === log_prev.level
                    && log.side === log_prev.side
                    && log.amount === log_prev.amount
                    ) {
                        if (!is_silent) console.log(`${JSON.stringify(log_prev)}\n${JSON.stringify(log)}`);
                }
                else {
                    // symbol, strat_id, ts, action, level, side, price, amount, pnl, commission
                    // const symbol_grid = `${log.symbol}_${log.strat_id}.csv`;
                    if (res.ts > log.ts) res.ts = log.ts;
                    if (res.ts_end < log.ts) res.ts_end = log.ts;
                    if (!res.logs[log.symbol]) res.logs[log.symbol] = [];
                    res.logs[log.symbol].push({
                        ts: log.ts, strat_id: log.st, action: log.act, level: log.level, side: log.side,
                        price: log.price, amount: log.amount, pnl: log.pnl, commission: log.commission,
                        enter_exit: log.enter_exit, pos_mode: log.pos_mode, tp: log.tp, sl: log.sl
                    });
                }
            }
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'get_logs', error: JSON.stringify(e)};
        console.log('ERR in db.get_logs:', JSON.stringify(msg));
    }
    return res;
}

// module.exports.GetAssetHistTsStartEnd = async function (){
//     let ts_start = Math.floor(HISTORICAL_TS_START / HIST_GRANULARITY_HOUR / 3600000) * HIST_GRANULARITY_HOUR * 3600000;
//     let ts_end = Math.floor(Date.now() / HIST_GRANULARITY_HOUR  / 3600000) * HIST_GRANULARITY_HOUR  * 3600000;
//     // var query = fs.readFileSync(process.cwd()+'/queries/get_saved_last.sql','utf-8');
//     var query = queries('get_ts_saved_asset_hist_last.sql');
//     query = query.replace(/{dev_mode}/g, DEV_MODE);
//     let tss = null;
//     try {
//         tss = await clickhouse_market.query(query).toPromise();
//         if (tss.length > 0) ts_start = Math.max(ts_start, tss[0].ts);
//         else {
//             query = queries('get_ts_saved_last.sql');
//             query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{direction}/g, '');
//             tss = await clickhouse_market.query(query).toPromise();
//             if (tss.length > 0) ts_start = Math.max(ts_start, tss[0].ts + 1);
//         }
//     } catch (error) {
//         let e = fit_error(error);
//         console.log('GetTsStart(asset) : ', JSON.stringify(e));
//         ts_start = 0;
//     }
//     return [ts_start, ts_end];
// }

// module.exports.GetPortfolioHistTsStartEnd = async function (){
//     let ts_start = Math.floor(HISTORICAL_TS_START / HIST_GRANULARITY_HOUR / 3600000) * HIST_GRANULARITY_HOUR * 3600000;
//     let ts_end = Math.floor(Date.now() / HIST_GRANULARITY_HOUR  / 3600000) * HIST_GRANULARITY_HOUR  * 3600000;
//     // var query = fs.readFileSync(process.cwd()+'/queries/get_saved_last.sql','utf-8');
//     var query = queries('get_ts_saved_portfolio_hist_last.sql');
//     query = query.replace(/{dev_mode}/g, DEV_MODE);
//     let tss = null;
//     try {
//         tss = await clickhouse_market.query(query).toPromise();
//         if (tss.length > 0) ts_start = Math.max(ts_start, tss[0].ts);
//         else {
//             query = queries('get_ts_saved_last.sql');
//             query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{direction}/g, '');
//             tss = await clickhouse_market.query(query).toPromise();
//             if (tss.length > 0) ts_start = Math.max(ts_start, tss[0].ts + 1);
//         }
//     } catch (error) {
//         let e = fit_error(error);
//         console.log('GetTsStart(portfolio) : ', JSON.stringify(e));
//         ts_start = 0;
//     }
//     return [ts_start, ts_end];
// }

// module.exports.GetTsStart = async function (){
//     let ts_start = HISTORICAL_TS_START;
//     // var query = fs.readFileSync(process.cwd()+'/queries/get_saved_last.sql','utf-8');
//     var query = queries('get_ts_saved_last.sql');
//     query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{direction}/g, 'DESC');
//     let tss = null;
//     try {
//         tss = await clickhouse_market.query(query).toPromise();
//         if (tss.length > 0) ts_start = Math.max(ts_start, tss[0].ts + 1);
//         else {
//             query = queries('get_ts_logs_first.sql');
//             query = query.replace(/{dev_mode}/g, DEV_MODE);
//             tss = await clickhouse_market.query(query).toPromise();
//             if (tss.length > 0) ts_start = Math.max(ts_start, tss[0].ts + 1);
//         }
//     } catch (error) {
//         let e = fit_error(error);
//         console.log('GetTsStart : ', JSON.stringify(e));
//         ts_start = 0;
//     }
//     return ts_start;
// }

module.exports.GetTsStart_Pnls = async function (ts_start, gran, account){
    let where = (!account) ? '' : `\n\tWHERE account = '${account}'`;
    let intern_where = (!account) ? '' : ` AND internal_acc_name = '${account}'`;
    var query = queries('get_ts_saved_asset_pnls_last.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE)
    .replace(/{gran}/g, gran).replace(/{hist_ts}/g, ts_start)
    .replace(/{where}/g, where).replace(/{intern_where}/g, intern_where);
    let tss = null;
    try {
        tss = await clickhouse_market.query(query).toPromise();
        if (tss.length > 0) ts_start = Math.max(ts_start, tss[0].ts);
    } catch (error) {
        let e = fit_error(error);
        console.log('GetTsStart_Pnls : ', JSON.stringify(e));
    }
    return ts_start;
}

// module.exports.GetTsStart_Pnls_Zero = async function (gran){
//     let ts_start = HISTORICAL_TS_START;
//     var query = queries('get_ts_saved_asset_pnls_last_zero.sql');
//     query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{gran}/g, gran);
//     let tss = null;
//     try {
//         tss = await clickhouse_market.query(query).toPromise();
//         if (tss.length > 0) ts_start = Math.max(ts_start, tss[0].ts);
//     } catch (error) {
//         let e = fit_error(error);
//         console.log('GetTsStart_Pnls_Zero : ', JSON.stringify(e));
//     }
//     return ts_start;
// }

module.exports.GetAccountsFromPosInfo = async function (ts_start, ts_end){
    let where_deleted = (DEBUG_WITH_DELETED) ? '' : `\n\tWHERE internal_acc_name NOT LIKE '%_dev' AND deleted = 0`;
    var query = queries('get_accounts_from_pos_info.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{where_deleted}/g, where_deleted)
    .replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let accounts = [];
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) accounts = res.map(c => c.account);
    } catch (error) {
        let e = fit_error(error);
        console.log('GetAccountsFromPosInfo : ', JSON.stringify(e));
        ts_start = 0;
    }
    return accounts;
}

module.exports.GetAccountsFromJournal = async function (){
    let where_deleted = (DEBUG_WITH_DELETED) ? '' : `\n\tWHERE internal_acc_name NOT LIKE '%_dev' AND deleted = 0`;
    var query = queries('get_accounts_from_journal.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{where_deleted}/g, where_deleted);
    let accounts = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) {
            accounts = res;
        }
    } catch (error) {
        let e = fit_error(error);
        console.log('GetAccountsFromJournal : ', JSON.stringify(e));
        ts_start = 0;
    }
    return accounts;
}

module.exports.GetCorrectionJournal = async function (account_id, tss){
    var query = queries('get_correction_journal.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{account_id}/g, account_id).replace(/{tss}/g, tss);
    let ret = [];
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) {
            ret = res.reduce((a,c) => {
                if (c.is_inc === 1) a[2] += c.income;
                if (c.symbol === '') {
                    if (!a[c.is_inc]['--']) a[c.is_inc]['--'] = {};
                    if (!a[c.is_inc]['--'][c.incomeType]) a[c.is_inc]['--'][c.incomeType] = [];
                    a[c.is_inc]['--'][c.incomeType].push(c);
                }
                else {
                    if (!a[c.is_inc][c.symbol]) a[c.is_inc][c.symbol] = {};
                    if (!a[c.is_inc][c.symbol][c.incomeType]) a[c.is_inc][c.symbol][c.incomeType] = [];
                    a[c.is_inc][c.symbol][c.incomeType].push(c);
                }
                return a;
            }, [{},{}, 0]);
        }
    } catch (error) {
        let e = fit_error(error);
        console.log('GetCorrectionJournal : ', JSON.stringify(e));
        ts_start = 0;
    }
    return ret;
}

module.exports.GetIncomesLogsCount = async function (account_id, tss){
    var query = queries('get_incomes_logs_count.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{account_id}/g, account_id).replace(/{tss}/g, tss);
    let ret = {incs:0, logs:0};
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) {
            ret = res[0];
        }
    } catch (error) {
        let e = fit_error(error);
        console.log('GetIncomesLogsCount : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetInc_VS_Balance = async function (account_id, tss){
    var query = queries('get_inc_vs_balance.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{account_id}/g, account_id).replace(/{tss}/g, tss);
    let ret = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) {
            /*
            F_start|F_end |S_start|S_end|FS_start|FS_end |funding|comm|W  |L  |F_diff|S_diff|FS_diff|I_diff|L_diff|User_cause|
            -------+------+-------+-----+--------+-------+-------+----+---+---+------+------+-------+------+------+----------+
             1000.0|1000.0|  46.38|46.38| 1046.38|1046.38|    0.0| 0.0|0.0|0.0|   0.0|   0.0|    0.0|   0.0|   0.0|       0.0|
            */
            ret = res[0];
            // ret.success = (res[0].max_balance > 0)
            // ? (res[0].del / res[0].max_balance < DEL_INCOMES_BALANCE_PCNT)
            // : (res[0].max_balance === 0 && res[0].del === 0);
        }
    } catch (error) {
        let e = fit_error(error);
        console.log('GetInc_VS_Balance : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetCorrectionJournal_old = async function (account_id, tss){
    var query = queries('get_correction_journal_old.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{account_id}/g, account_id).replace(/{tss}/g, tss);
    let ret = [];
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res.length > 0) {
            ret = res;
        }
    } catch (error) {
        let e = fit_error(error);
        console.log('GetCorrectionJournal : ', JSON.stringify(e));
        ts_start = 0;
    }
    return ret;
}

module.exports.GetOpenPoses = async function (){
    var query = queries('get_open_poses.sql').replace(/{dev_mode}/g, DEV_MODE);
    let oposes = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res && res.length > 0) oposes = res.reduce((a,c) => {
            if (!a[c.account]) a[c.account] = {};
            if (!a[c.account][c.asset]) a[c.account][c.asset] = [];
            c.is_closed = false;
            a[c.account][c.asset].push(c);
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetOpenPoses : ', JSON.stringify(e));
    }
    return oposes;
}

module.exports.GetPnls = async function (ts_start, batch_size, in_accounts){
    let ts_end = ts_start + batch_size;
    var query = queries('get_pnls.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let accounts = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res && res.length > 0) accounts = res.reduce((a,c) => {
            if (in_accounts) {
                if (in_accounts.includes(c.account)) {
                    if (!a[c.account]) a[c.account] = [];
                    a[c.account].push(c);
                }
            }
            else {
                if (!a[c.account]) a[c.account] = [];
                a[c.account].push(c);
            }
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetPnls : ', JSON.stringify(e));
    }
    return accounts;
}

module.exports.GetAssetPnlsShort = async function (account){
    var query = queries('get_asset_pnls_short.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{account}/g, account);
    let accounts = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res && res.length > 0) accounts = res.map(c => c.asset);
    } catch (error) {
        let e = fit_error(error);
        console.log('GetAssetPnls : ', JSON.stringify(e));
    }
    return accounts;
}

module.exports.GetAssetPnls = async function (account, ts_start, batch_size){
    let ts_end = ts_start + batch_size;
    var query = queries('get_asset_pnls.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{account}/g, account)
    .replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let accounts = null;
    try {
        let res = await clickhouse_market.query(query).toPromise();
        if (res && res.length > 0) accounts = res.reduce((a,c) => {
            if (!a[c.asset]) a[c.asset] = [];
            a[c.asset].push(c);
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetAssetPnls : ', JSON.stringify(e));
    }
    return accounts;
}

module.exports.SaveAcc___Pnls = async function (account, asset, is_porto, is_short, ts_start, batch_size, granule_str, gran) {
    let ts_end = ts_start + batch_size;
    let deleted = (DEBUG_WITH_DELETED) ? '' : ` AND internal_acc_name NOT LIKE '%_dev' AND deleted = 0`;
    let ___ = (is_porto) ? '': 'asset_';
    let _s_ = (is_short) ? '_short': '';
    var query = queries(`save_acc_${___}pnls${_s_}.sql`);
    query = query.replace(/{dev_mode}/g, DEV_MODE)
    .replace(/{account}/g, account).replace(/{asset}/g, asset).replace(/{deleted}/g, deleted)
    .replace(/{granule_str}/g, granule_str).replace(/{gran}/g, gran)
    .replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let res = null;
    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        if (_res) {
            res = true;
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'SaveAcc___Pnls', error: JSON.stringify(e)};
        console.log('ERR in db.SaveAcc___Pnls:', JSON.stringify(msg));
    }
    return res;

}

module.exports.SaveAcc___NPs = async function (account, ts_start_hist, ts_start, batch_size, granule_str, gran) {
    let ts_end = ts_start + batch_size;
    let deleted = (DEBUG_WITH_DELETED) ? '' : ` AND internal_acc_name NOT LIKE '%_dev' AND deleted = 0`;
    var query = queries(`save_acc_asset_nps.sql`);
    query = query.replace(/{dev_mode}/g, DEV_MODE)
    .replace(/{deleted}/g, deleted)
    .replace(/{account}/g, account)
    .replace(/{granule_str}/g, granule_str).replace(/{gran}/g, gran)
    .replace(/{ts_start}/g, ts_start).replace(/{ts_start_hist}/g, ts_start_hist).replace(/{ts_end}/g, ts_end);
    let res = null;
    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        if (_res) {
            res = true;
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'SaveAcc___NPs', error: JSON.stringify(e)};
        console.log('ERR in db.SaveAcc___NPs:', JSON.stringify(msg));
    }
    return res;

}

module.exports.SaveSpecificTP = async function (ts_start, ts_end) {
    var query = queries(`save_specific_tp.sql`);
    query = query.replace(/{dev_mode}/g, DEV_MODE)
    .replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let res = null;
    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        if (_res) {
            res = true;
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'SaveSpecificTP', error: JSON.stringify(e)};
        console.log('ERR in db.SaveSpecificTP:', JSON.stringify(msg));
    }
    return res;
}

module.exports.DeleteAccount = async function (db, tbl, where) {
    if (!db) db = 'db_analytics';
    var query = `ALTER TABLE ${db}${DEV_MODE}.${tbl} DELETE WHERE ${where}`;
    let res = null;
    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        if (_res) {
            res = true;
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'DeleteAccount', tbl, error: JSON.stringify(e)};
        console.log('ERR in db.DeleteAccount:', JSON.stringify(msg));
    }
    return res;

}

module.exports.Truncate = async function (tbl) {
    var query = `TRUNCATE TABLE db_analytics${DEV_MODE}.${tbl}`;
    let res = null;
    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        if (_res) {
            res = true;
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'Truncate', tbl, error: JSON.stringify(e)};
        console.log('ERR in db.Truncate:', JSON.stringify(msg));
    }
    return res;

}

module.exports.Create = async function (tbl) {
    var query = queries(`create_${tbl}.sql`);
    query = query.replace(/{dev_mode}/g, DEV_MODE);
    let res = null;
    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        if (_res) {
            res = true;
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'Create', tbl, error: JSON.stringify(e)};
        console.log('ERR in db.Create:', JSON.stringify(msg));
    }
    return res;

}

module.exports.GetLocalProfitByAccountAssetTs = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_profit_asset_hist.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let ret = [];
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) {
            let cum_sum = {};
            ret = _ret.reduce((a,c) => {
                if (!cum_sum[c.account]) cum_sum[c.account] = {};
                if (!cum_sum[c.account][c.asset]) cum_sum[c.account][c.asset] = 0;
                cum_sum[c.account][c.asset] += c.profit;
                c.profit_cum_sum = cum_sum[c.account][c.asset];
                if (!a[c.account]) a[c.account] = {};
                if (!a[c.account][c.asset]) a[c.account][c.asset] = {};
                if (!a[c.account][c.asset][c.ts_group]) a[c.account][c.asset][c.ts_group] = {};
                if (!a[c.account][c.asset][c.ts_group][c.tss]) a[c.account][c.asset][c.ts_group][c.tss] = c;
                // a[c.account][c.asset][c.ts_group].push(c);
                return a;
            }, {});
        }
    } catch (error) {
        let e = fit_error(error);
        console.log('GetLocalProfitByAccountAssetTs : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetLocalProfitByAccountTs = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_profit_hist.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let ret = [];
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) {
            let cum_sum = {};
            ret = _ret.reduce((a,c) => {
                if (!cum_sum[c.account]) cum_sum[c.account] = 0;
                cum_sum[c.account] += c.profit;
                c.profit_cum_sum = cum_sum[c.account];
                if (!a[c.account]) a[c.account] = {};
                if (!a[c.account][c.ts_group]) a[c.account][c.ts_group] = [];
                a[c.account][c.ts_group].push(c);
                return a;
            }, {});
        }
    } catch (error) {
        let e = fit_error(error);
        console.log('GetLocalProfitByAccountTs : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetBalanceHistByAccountAssetTs = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_balance_asset_hist.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let ret = null;
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c,i) => {
            if (!a[c.account]) a[c.account] = {};
            if (!a[c.account][c.asset]) a[c.account][c.asset] = {};
            if (!a[c.account][c.asset][c.ts_group]) a[c.account][c.asset][c.ts_group] = [];
            a[c.account][c.asset][c.ts_group].push(c);
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetBalanceHistByAccountTs : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetBalanceAndSpotHistByAccountTs = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_balance_and_spot_hist.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let ret = null;
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c,i) => {
            if (!a[c.account]) a[c.account] = {};
            if (!a[c.account][c.ts_group]) a[c.account][c.ts_group] = {};
            a[c.account][c.ts_group][c.tss] = c;
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetBalanceHistByAccountTs : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetBalanceHistByAccountTs = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_balance_hist.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let ret = null;
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c,i) => {
            if (!a[c.account]) a[c.account] = {};
            if (!a[c.account][c.ts_group]) a[c.account][c.ts_group] = [];
            a[c.account][c.ts_group].push(c);
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetBalanceHistByAccountTs : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetAssetHistForInsertByAccountTs = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_for_insert_asset_hist.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let ret = null;
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            if (!a[c.account]) a[c.account] = {};
            if (!a[c.account][c.asset]) a[c.account][c.asset] = [];
            a[c.account][c.asset].push(c);
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetAssetHistForInsertByAccountTs : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetPortfolioHistForInsertByAccountLogsTs = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    let where_deleted = (DEBUG_WITH_DELETED) ? '' : ` AND internal_acc_name NOT LIKE '%_dev' AND deleted = 0`;
    var query = queries('get_for_insert_portfolio_hist_from_logs.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{where_deleted}/g, where_deleted)
    .replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let ret = null;
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            if (!a[c.account]) a[c.account] = [];
            a[c.account].push(c);
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetPortfolioHistForInsertByAccount : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetPortfolioHistForInsertByAccountTs = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_for_insert_portfolio_hist.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let ret = null;
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            if (!a[c.account]) a[c.account] = [];
            a[c.account].push(c);
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetPortfolioHistForInsertByAccount : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetTotalProfitByAccountAsset = async function (ts){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_total_profits_asset_last.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts}/g, ts);
    let ret = {};
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            if (!a[c.account]) a[c.account] = {};
            a[c.account][c.asset] = {
                total_profit: c.total_profit,
                peak: c.peak,
                peak_balance: c.peak_balance,
                valley: c.valley,
                balance: c.balance,
                max_balance: c.max_balance,
                balance_beginning: c.balance_beginning,
                ts_beginning: c.ts_beginning,
                mdd: c.mdd,
                mdd_pcnt: c.mdd_pcnt,

                N: c.N,
                mean_profit: c.mean_profit,
                dev_profit: c.dev_profit,
                mean_balance: c.mean_balance,
                dev_balance: c.dev_balance,

                meanX: c.meanX,
                devX: c.devX,
                meanY: c.meanY,
                devY: c.devY,
                devXY: c.devXY,

                pos_np: c.pos_np,
                neg_np: c.neg_np
            }
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetTotalProfitByAccountAsset : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetTotalProfitByAccountLogs = async function (){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_total_profits_portfolio_logs_last.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE);
    let ret = {};
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            a[c.account] = c;
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetTotalProfitByAccountLogs : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetTotalProfitByAccount = async function (ts){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_total_profits_portfolio_last.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts}/g, ts);
    let ret = {};
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            a[c.account] = {
                total_profit: c.total_profit,
                peak: c.peak,
                peak_balance: c.peak_balance,
                valley: c.valley,
                balance: c.balance,
                max_balance: c.max_balance,
                balance_beginning: c.balance_beginning,
                ts_beginning: c.ts_beginning,
                mdd: c.mdd,
                mdd_pcnt: c.mdd_pcnt,
 
                N: c.N,
                mean_profit: c.mean_profit,
                dev_profit: c.dev_profit,
                mean_balance: c.mean_balance,
                dev_balance: c.dev_balance,

                meanX: c.meanX,
                devX: c.devX,
                meanY: c.meanY,
                devY: c.devY,
                devXY: c.devXY,

                pos_np: c.pos_np,
                neg_np: c.neg_np
            }
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetTotalProfitByAccount : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetNotClosedPoses = async function (ts){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_not_closed_poses.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts}/g, ts);
    let ret = {};
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            if (!a[c.account]) a[c.account] = {};
            if (!a[c.account][c.asset]) a[c.account][c.asset] = {};
            if (!a[c.account][c.asset][c.ts_start]) a[c.account][c.asset][c.ts_start] = [];
            a[c.account][c.asset][c.ts_start].push(c);
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetNotClosedPoses : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetAnyPoses = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/get_not_closed_poses.sql','utf-8');
    var query = queries('get_not_closed_and_evolution_poses.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let ret = {};
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            if (c.dummy === 1) {
                if (!a.poses[c.account]) a.poses[c.account] = {};
                if (!a.poses[c.account][c.asset]) a.poses[c.account][c.asset] = {};
                if (!a.poses[c.account][c.asset][c.ts_group]) a.poses[c.account][c.asset][c.ts_group] = {};
                if (!a.poses[c.account][c.asset][c.ts_group][c.tss]) a.poses[c.account][c.asset][c.ts_group][c.tss] = c;
            }
            else {
                if (!a.open_poses[c.account]) a.open_poses[c.account] = {};
                if (!a.open_poses[c.account][c.asset]) a.open_poses[c.account][c.asset] = c.grid_max_pos;
            }
            return a;
        }, {poses: {}, open_poses: {}});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetAnyPoses : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetLogs = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/take_logs_for_poses.sql','utf-8');
    var query = queries('take_logs_for_poses.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    let ret = {};
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            if (!a[c.account]) a[c.account] = {};
            if (!a[c.account][c.asset]) a[c.account][c.asset] = [];
            a[c.account][c.asset].push(c);
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetLogs : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetLogsForPoses = async function (account, ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/take_logs_for_poses.sql','utf-8');
    let deleted = (DEBUG_WITH_DELETED) ? '' : ' AND deleted = 0';
    var query = queries('get_logs_for_poses.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{account}/g, account)
    .replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end).replace(/{deleted}/g, deleted);
    let ret = {};
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            if (!a[c.asset]) a[c.asset] = [];
            a[c.asset].push(c);
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetLogsForPoses : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetStartOrdersHist = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/take_logs_for_poses.sql','utf-8');
    var query = queries('take_configs.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE)
    .replace(/{ts_start}/g, Math.round(ts_start/1000))
    .replace(/{ts_end}/g, Math.round(ts_end/1000));
    let ret = {};
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        if (_ret.length > 0) ret = _ret.reduce((a,c) => {
            const account = c.account;
            if (!a[account]) a[account] = {};
            const asset = c.asset;
            if (!a[account][asset]) a[account][asset] = {};
            const strat_id = c.strat_id;
            if (!a[account][asset][strat_id]) a[account][asset][strat_id] = [];
            a[account][asset][strat_id].push({
                ts: c.ts,
                start_order_usd_long: c.start_order_usd_long,
                start_order_usd_short: c.start_order_usd_short
            });
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetLogs : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetStartOrdersHist_old = async function (ts_start, ts_end){
    // var query = fs.readFileSync(process.cwd()+'/queries/take_logs_for_poses.sql','utf-8');
    var query = queries('take_configs_old.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE)
    .replace(/{ts_start}/g, Math.round(ts_start/1000))
    .replace(/{ts_end}/g, Math.round(ts_end/1000));
    let ret = {};
    try {
        let _ret = await clickhouse_market.query(query).toPromise();
        let res_raw = _ret.map(c => { return {ts: Math.round(c.ts*1000), account: c.account, config: JSON.parse(c.config)}; });
        if (res_raw.length > 0) ret = res_raw.reduce((a,c) => {
            const account = c.account;
            if (!a[account]) a[account] = {};
            let assets = Object.keys(c.config);
            for (let ai = 0; ai < assets.length; ai++) {
                const asset = assets[ai];
                let conf = c.config[asset];
                if (!a[account][asset]) a[account][asset] = {};
                const strat_id = +((conf.TRADING_PATTERN) ? conf.TRADING_PATTERN : 0);
                if (!a[account][asset][strat_id]) a[account][asset][strat_id] = [];
                a[account][asset][strat_id].push({
                    ts: c.ts,
                    start_order_usd_long: conf.start_order_usd_long,
                    start_order_usd_short: conf.start_order_usd_short
                });
            }
            return a;
        }, {});
    } catch (error) {
        let e = fit_error(error);
        console.log('GetLogs : ', JSON.stringify(e));
    }
    return ret;
}

module.exports.GetGrids = async function () {
    let res = null;
    var query = queries('take_grids.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE);

    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        if (_res && _res.length > 0) {
            let res_raw = _res.map(c => { return {strat_id: c.strat_id, pattern: JSON.parse(c.pattern)}; });
            res = res_raw.reduce((a,c) => {
                const [steps_long, steps_short] = [
                    (c.pattern.steps_pcnts_long && c.pattern.steps_pcnts_long.length > 0) ? c.pattern.steps_pcnts_long : ['0-0-0-0'],
                    (c.pattern.steps_pcnts_short && c.pattern.steps_pcnts_short.length > 0) ? c.pattern.steps_pcnts_short : ['0-0-0-0']
                ];
                a[c.strat_id] = {
                    steps_long: _steps_to_grid_table (steps_long, 1),
                    steps_short: _steps_to_grid_table (steps_short, -1)
                };
                return a;
            }, {});
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'get_grids', error: JSON.stringify(e)};
        console.log('ERR in db.get_grids:', JSON.stringify(msg));
    }
    return res;
}

function _steps_to_grid_table (steps, type, start_order) {

    let tbl = steps.map(c => c.split('-').reduce((a, e, i) => {
        if (i === 0) a.level = +e;
        else if (i === 1) a.diff = +e;
        else if (i === 2) a.martin = +e;
        return a;
    }, {}));

    if (tbl.length > 0) {
        let mul_price_diff = 1;
        let mul_order = 1;
        let sum_pos = 0;
        let sum_pos_coin = 0;

        if (!start_order) start_order = 1; // 10
        let start_price = 1; // 10
        for (let ti = 0; ti < tbl.length; ti++) {
            mul_price_diff *= ( 1 - type * tbl[ti].diff / 100 );
            tbl[ti].price = start_price * mul_price_diff;
            tbl[ti].price_diff = Math.round((mul_price_diff - 1) * RATE_PRECISION) / RATE_PRECISION;
            mul_order *= (1 + tbl[ti].martin/100);
                tbl[ti].order = start_order * mul_order;
            sum_pos += mul_order;
                tbl[ti].pos = start_order * sum_pos;
                tbl[ti].order_coin = start_order / start_price * (mul_order / mul_price_diff);
            sum_pos_coin += mul_order / mul_price_diff;
                tbl[ti].pos_coin = start_order / start_price * sum_pos_coin;
                tbl[ti].avg_price = start_price * sum_pos / sum_pos_coin;
            tbl[ti].price_lag = Math.round((mul_price_diff * sum_pos_coin / sum_pos - 1) * RATE_PRECISION) / RATE_PRECISION;
            tbl[ti].tq = (tbl[ti].price_lag === 0) ? 0 : Math.round(tbl[ti].price_diff / tbl[ti].price_lag * RATE_PRECISION) / RATE_PRECISION;
        }
    }

    return tbl;
}

module.exports.SaveArray = async function (rows, fquery) {
    var query = queries(fquery);
    query = query.replace(/{dev_mode}/g, DEV_MODE);

    return (await save_rows(query, rows));
}

module.exports.SaveUnPnlArray = async function (rows) {
    var query = queries(`get_max_risk_pos.sql`);
    query = query.replace(/{dev_mode}/g, DEV_MODE);
    for (let ri = 0; ri < rows.length; ri++) {
        let row = rows[ri];
        // [c.account, c.asset, c.ts_start, c.ts_end]
        let q = query.replace(/{account}/g, row[0]).replace(/{asset}/g, row[1]).replace(/{ts_start}/g, row[2]).replace(/{ts_end}/g, row[3]);
        let _res = (await clickhouse_market.query(q).toPromise());
        row[3] = (_res && _res.length > 0) ? _res[0].min_unpnl : 0;
    }

    query = queries(`insert_poses_unpnl.sql`);
    query = query.replace(/{dev_mode}/g, DEV_MODE);
    // poses_unpnl (account, asset, ts_start, min_unpnl)

    return (await save_rows(query, rows));
}

module.exports.SaveUnPnl = async function (ts_start, ts_end, ts_hist) {
    let res = false;
    var query = queries('reload_dict.sql');
    query = query.replace(/{dev_mode}/g, DEV_MODE);
    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        query = queries(`insert_max_risk_poses.sql`);
        query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end).replace(/{ts_hist}/g, ts_hist);
        _res = (await clickhouse_market.query(query).toPromise());
        if (_res) {
            res = true;
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'SaveUnPnl', error: JSON.stringify(e)};
        console.log('ERR in db.SaveUnPnl:', JSON.stringify(msg));
    }
    return res;
}

module.exports.SaveAssetHist = async function (ts_start, ts_end) {
    let res = false;
    query = queries(`insert_asset_hist.sql`);
    query = query.replace(/{dev_mode}/g, DEV_MODE).replace(/{ts_start}/g, ts_start).replace(/{ts_end}/g, ts_end);
    try {
        let _res = (await clickhouse_market.query(query).toPromise());
        if (_res) {
            res = true;
        }
    } catch (error) {
        let e = fit_error(error);
        let msg = {fn: 'SaveUnPnl', error: JSON.stringify(e)};
        console.log('ERR in db.SaveUnPnl:', JSON.stringify(msg));
    }
    return res;
}

async function DoesTableExist (){
    var query = fs.readFileSync(process.cwd()+'/queries/get_tbl_columns.sql','utf-8');
    query = query.replace(/{base}/g, global.params.BASE).replace(/{quote}/g, global.params.QUOTE)
    .replace(/{table_prefix}/g, global.params.TABLE_PREFIX).replace(/{granule}/g, global.params.GRANULE);
    let columns = (await clickhouse_market.query(query).toPromise()).map(c => c.name).sort();
    return columns.length > 0;
}

module.exports.DoesTableExist = DoesTableExist;

module.exports.GetHistTsStart = async function (){
    let WARM_UP_MINUTES = global.params.WARM_UP_MINUTES;
    let ts_start = global.params.HISTORICAL_TS_START;
    var query = fs.readFileSync(process.cwd()+'/queries/get_hist_ts_start.sql','utf-8');
    query = query.replace(/{base}/g, global.params.BASE).replace(/{quote}/g, global.params.QUOTE);
    try {
        tss = await clickhouse_market.query(query).toPromise();
        if (tss.length > 0) {
            _ts = Math.ceil(tss[0].ts / 24 / 3600) * 24 * 3600;
            ts_start = Math.max(ts_start, _ts);
        }
    } catch (error) {
        let e = fit_error(error);
        console.log('GetHistTsStart : ', JSON.stringify(e));
    }
    return ts_start + WARM_UP_MINUTES*60;
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
