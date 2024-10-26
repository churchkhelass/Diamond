const URL = require('url');
const DB_API = require('../connectors/db_api');
const __process_main_page = require('./__process_main_page');


module.exports.page_load = async function(req,res,next) {
    try {
        __process_main_page(req, res, 'Report', 'Report');
    } catch (error) {
        console.log(error)
    }
}

module.exports.get_datasources = async function(req,res,next) {
    try {
        var url_parts = URL.parse(req.url, true);
        var ts_start = url_parts.query.ts_start || null;
        var ts_end = url_parts.query.ts_end || null;
        let result = await DB_API.get_datasources(ts_start, ts_end);
        res.send(result);

    } catch (error) {
        console.log(error);
        res.send({'result':'Something wrong'});
    }
}