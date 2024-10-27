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

// get_columns

module.exports.get_columns = async function(req,res,next) {
    try {
        var url_parts = URL.parse(req.url, true);
        var name = url_parts.query.name || null;
        if (name) {
            let result = await DB_API.get_columns(name);
            res.send(result);
        }

    } catch (error) {
        console.log(error);
        res.send({'result':'Something wrong'});
    }
}

module.exports.get_report = async function(req,res,next) {
    try {
        var url_parts = URL.parse(req.url, true);
        var report_name = url_parts.query.report_name || null;
        if (report_name) {
            let result = await DB_API.get_report(report_name);
            res.send(result);
        }

    } catch (error) {
        console.log(error);
        res.send({'result':'Something wrong'});
    }
}

module.exports.save = async function(req,res,next) {
    try {
        let { name, desc, datasource_name, fields } = req.body;
        // (ts, name, desc, datasource_name, fields, user_id)
        let user_id = 0;
        let r = await DB_API.SaveArray([[Date.now(), name, desc, datasource_name, fields, user_id]], 'insert_report_meta.sql');
        res.json(r);
    } catch (error) {
        console.log(error);
        res.send({'result':'Something wrong'});
    }
}