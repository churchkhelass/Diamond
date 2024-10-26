const connectors = require('../connectors');

const KPI_SAVE_HOUR = +(process.env.KPI_SAVE_HOUR || '0.05');
const KPI_SAVE_HOUR_CICLE = +(process.env.KPI_SAVE_HOUR_CICLE || '0.15');

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

module.exports.define = async function (){
    if (!global.gc) {
        console.error(`ERROR: Flag "--expose-gc" should be hired!`);
        process.exit(1);
    }

    global.in_progress = 0xFFFF0000; // 0b11111111111111110000000000000000   ->   0b00000000000000001111111111111111   0x0000FFFF
    global.ignore_logs = true;
    global.init_done = false;
    
    global.connectors = connectors;
    global.gbars = [];
    global.params = {};

    global.params.HISTORICAL_TS_START = +(process.env.HISTORICAL_TS_START);
    global.params.TS_BREAK = +(process.env.TS_BREAK || '');

    // TODO Database CREATE if nor exists
    let tbls = [
        'tbl_asset_nps',
        'tbl_asset_poses',
        'tbl_asset_oposes',
        'tbl_pnls_hour',
        'tbl_pnls_ext_hour',
        'tbl_pnls_short_hour',
        'tbl_asset_pnls_hour',
        'tbl_asset_pnls_ext_hour',
        'tbl_asset_pnls_short_hour'
    ]
    for (let ti = 0; ti < tbls.length; ti++) {
        const tbl = tbls[ti];
        await connectors.db_market.Create(tbl);
    }

    await connectors.self.Init();
    while (!global.init_done){
        await sleep(60000);
        console.log('INIT is still running ...........');
    }
    console.log('INIT DONE ========================================');
    global.ignore_logs = false;

    if (KPI_SAVE_HOUR_CICLE !== 0) {
        let ts_now = Date.now();
        console.log(`ts_now: ${DT(ts_now)}`);
        let ts_future = Math.round((Math.floor((ts_now - KPI_SAVE_HOUR * 3600 * 1000) / KPI_SAVE_HOUR_CICLE / 3600 / 1000) + 1)
            * KPI_SAVE_HOUR_CICLE * 3600 * 1000 + KPI_SAVE_HOUR * 3600 * 1000);
        console.log(`ts_future: ${DT(ts_future)}`);

        let ts_del = ts_future - ts_now;

        console.log(`ts_future: ${DT(ts_future)}`);
        // console.log((ts_future - ts_now) / 1000 / 60);
        setTimeout(async function cron_cicle() {
            let dt = new Date(Date.now());
            console.log(`------------- CRON TASK [${dt.getHours()}]:[${dt.getMinutes()}]:[${dt.getSeconds()}]`);
            await connectors.self.Log();
            ts_now = Date.now();
            dt = new Date(ts_now);
            console.log(`------------- CRON TASK END [${dt.getHours()}]:[${dt.getMinutes()}]:[${dt.getSeconds()}]`);

            console.log(`ts_now   : ${DT(ts_now)}`);

            ts_future = ts_future = Math.round((Math.floor((ts_now - KPI_SAVE_HOUR * 3600 * 1000) / KPI_SAVE_HOUR_CICLE / 3600 / 1000) + 1)
                * KPI_SAVE_HOUR_CICLE * 3600 * 1000 + KPI_SAVE_HOUR * 3600 * 1000);

            console.log(`ts_future: ${DT(ts_future)}`);

            ts_del = ts_future - ts_now;

            setTimeout(cron_cicle, ts_del);

        }, ts_del);
    }

}

function DT(ts) {
    return `${(new Date(ts)).toISOString().replace(/T/g, '.').substring(0, 19)}`;
}
