const request = require('request-promise');

module.exports.Log = async function (){
    let url = `http://localhost:${process.env.API_PORT}/log`;
    let res_ = await get_data(url, 'GET', {});
    if(!res_.success) {
        console.log('Log was Started with Error');
        process.exit(1);
    }

    return res_.success;
}

module.exports.Init = async function (){
    let url = `http://localhost:${process.env.API_PORT}/init`;
    let res_ = await get_data(url, 'GET', {});
    if(!res_.success) {
        console.log('Init was Started with Error');
        process.exit(1);
    }

    return res_.success;
}

async function get_data(url, method, body) {
    let res = {success: false, error: "", result: {}};
    const options = {
        method: method,
        url: url,
        body: body,
        json: true
    };
    await request(options).then(body => {
        res.success = true;
        res.result = body;
    })
    .catch(err => {
        res.error = err.message;
        console.log(`Error in ${method} ${url}: ${err.message}`);
    });
    return res;
}