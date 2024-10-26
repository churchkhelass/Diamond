const url = require("url");
const fs = require("fs");

const URL = require('url');

module.exports.init = async function(req, res){
    let [api_name, strt] = ['INIT', Date.now()];
    res.status(204).send();

    let a = (global.in_progress >>> 16);
    if (a === 0x0000FFFF){
        global.in_progress = a;
        MemoryUsage(`${api_name}.---MEM---.ON_START`, strt);
        logging(strt, api_name, {message: `Init STARTED`});

        MemoryUsage(`${api_name}.---MEM---.AFTER.CUTTING`, strt);
        global.init_done = true;
        global.in_progress = 0xFFFF0000;
    }

}

function logging(strt, api_name, log) {
    let fnt = Date.now();
    let dtlog = `${fnt} [${(new Date(fnt)).toISOString().replace(/T/g, ' ').substring(0, 19)}]\t[${fnt - strt}]\t`;
    console.log(`${dtlog} @ ${api_name}: ${JSON.stringify(log)}`);
}

function fit_error(err){
    let e = {
        code: err.code,
        message: err.message,
        stack: err.stack
    };
    return e;
}

function MemoryUsage(api_name, strt) {
    let memory = process.memoryUsage();
    memory.rss = Math.round(memory.rss / 1024 / 1024);
    memory.heapTotal = Math.round(memory.heapTotal / 1024 / 1024);
    memory.heapUsed = Math.round(memory.heapUsed / 1024 / 1024);
    memory.external = Math.round(memory.external / 1024 / 1024);
    logging(strt, `${api_name}.MEMORY_USAGE`, memory);
}

function MemorySizeOf(obj) {
    var bytes = 0;

    function sizeOf(obj) {
        if(obj !== null && obj !== undefined) {
            switch(typeof obj) {
            case 'number':
                bytes += 8;
                break;
            case 'string':
                bytes += obj.length * 2;
                break;
            case 'boolean':
                bytes += 4;
                break;
            case 'object':
                var objClass = Object.prototype.toString.call(obj).slice(8, -1);
                if(objClass === 'Object' || objClass === 'Array') {
                    for(var key in obj) {
                        if(!obj.hasOwnProperty(key)) continue;
                        sizeOf(obj[key]);
                    }
                } else bytes += obj.toString().length * 2;
                break;
            }
        }
        return bytes;
    };

    function formatByteSize(bytes) {
        if(bytes < 1024) return bytes + " bytes";
        else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
        else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
        else return(bytes / 1073741824).toFixed(3) + " GiB";
    };

    return sizeOf(obj);
    // return formatByteSize(sizeOf(obj));
}
