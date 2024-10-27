process.on('unhandledRejection', up => { throw up });

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
require('dotenv').config();

const routes = require('./routes');

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 1000000}));

app.use(cookieParser());

app.use("/css", express.static(__dirname + '/www/css'));
app.use("/img", express.static(__dirname + '/www/img'));
app.use("/js", express.static(__dirname + '/www/js'));
app.use("/js/lib", express.static(__dirname + '/www/js/lib'));

app.use("/builder/css", express.static(__dirname + '/www/css'));
app.use("/builder/img", express.static(__dirname + '/www/img'));
app.use("/builder/js", express.static(__dirname + '/www/js'));
app.use("/builder/js/lib", express.static(__dirname + '/www/js/lib'));

app.use("/viewer/css", express.static(__dirname + '/www/css'));
app.use("/viewer/img", express.static(__dirname + '/www/img'));
app.use("/viewer/js", express.static(__dirname + '/www/js'));
app.use("/viewer/js/lib", express.static(__dirname + '/www/js/lib'));


app.use(routes);
 
app.listen(process.env.PORT, function () { 
    console.log('You can use http://127.0.0.1:'+process.env.PORT);
});

(async function () {
    await require('./global').define();
})();