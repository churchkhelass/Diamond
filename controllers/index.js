module.exports.root = function(req, res, next) {
    return res.redirect('/reports');
}

module.exports.ico = function(req, res) {
    res.status(204).send();
}

module.exports.reports = require(`./reports`);
module.exports.report = require(`./report`);
module.exports.datasource = require(`./datasource`);
module.exports.onepage = require(`./onepage`);
