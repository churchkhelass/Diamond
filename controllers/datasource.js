const URL = require('url');
const DB_API = require('../connectors/db_api');
const __process_main_page = require('./__process_main_page');


module.exports.page_load = async function(req,res,next) {
    try {
        __process_main_page(req, res, 'datasource', 'Datasource', 'Datasource');
    } catch (error) {
        console.log(error)
    }
}

module.exports.save = async function(req,res,next) {
    try {
        let { a, b } = req.body;
        let r = await DB_API.SaveArray();
        res.json(r);
    } catch (error) {
        console.log(error);
        res.send({'result':'Something wrong'});
    }
}
