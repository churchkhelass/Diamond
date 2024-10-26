const connectors = require('../connectors');

const KPI_SAVE_HOUR = +(process.env.KPI_SAVE_HOUR || '0.05');
const KPI_SAVE_HOUR_CICLE = +(process.env.KPI_SAVE_HOUR_CICLE || '0.15');

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

module.exports.define = async function (){
    // if (!global.gc) {
    //     console.error(`ERROR: Flag "--expose-gc" should be hired!`);
    //     process.exit(1);
    // }

    global.in_progress = 0xFFFF0000; // 0b11111111111111110000000000000000   ->   0b00000000000000001111111111111111   0x0000FFFF
    global.ignore_logs = true;
    global.init_done = false;
    
    global.connectors = connectors;
    // await connectors.self.Init();
    // while (!global.init_done){
    //     await sleep(60000);
    //     console.log('INIT is still running ...........');
    // }
    console.log('INIT DONE ========================================');
    global.ignore_logs = false;
}

function DT(ts) {
    return `${(new Date(ts)).toISOString().replace(/T/g, '.').substring(0, 19)}`;
}
