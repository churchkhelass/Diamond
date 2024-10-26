const URL = require('url');
// const DB = require('../connectors/DB');
const __process_main_page = require('./__process_main_page');


module.exports.page_load = async function(req,res,next) {
    try {
        __process_main_page(req, res, 'One Page', 'One Page');
    } catch (error) {
        console.log(error);
    }
}
