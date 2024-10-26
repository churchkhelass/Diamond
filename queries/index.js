const fs = require('fs');
module.exports.get_query = function (file_name) {
    var path = `${__dirname}/${file_name}`;
    var query = fs.readFileSync(path,'utf-8');
    return (query) ? query : null;
};