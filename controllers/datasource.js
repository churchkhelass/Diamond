const URL = require('url');
const DB_API = require('../connectors/db_api');
const __process_main_page = require('./__process_main_page');


module.exports.page_load = async function(req,res,next) {
    try {
        __process_main_page(req, res, 'Datasource', 'Datasource');
    } catch (error) {
        console.log(error)
    }
}

module.exports.save = async function(req,res,next) {
    try {
        let { name, sql } = req.body;
        // (ts, name, query, user_id)
        let user_id = 0;
        let r = await DB_API.SaveArray([[Date.now(), name, sql, user_id]], 'insert_datasource.sql');
        res.json(r);
    } catch (error) {
        console.log(error);
        res.send({'result':'Something wrong'});
    }
}
