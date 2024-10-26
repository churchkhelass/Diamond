module.exports.cmd = require('./cmd');

module.exports.root = function(req, res, next) {
    let paths = __dirname.split('/');
    res.status(200).json({ message: "that's APIs of "+paths[paths.length-2] });
}
module.exports.ico = function(req, res) {
    res.status(204).send();
}