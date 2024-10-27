const URL = require('url');
const DB_API = require('../connectors/db_api');
const __process_main_page = require('./__process_main_page');


module.exports.page_load = async function(req,res,next) {
    try {
        __process_main_page(req, res, 'Reports', 'Reports');
    } catch (error) {
        console.log(error)
    }
}

module.exports.get_reports = async function(req,res,next) {
    try {
        let result = await DB_API.get_reports();
        res.send(result);

    } catch (error) {
        console.log(error);
        res.send({'result':'Something wrong'});
    }
}