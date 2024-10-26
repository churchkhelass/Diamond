const fs = require('fs');
const IS_DEV = +process.env.IS_DEV || 0;

module.exports = async function(req, res, specific_name, h1_header, head_title) {
    let main_page = fs.readFileSync(`${process.cwd()}/www/index.html`, 'utf-8');
    let page_inner = fs.readFileSync(`${process.cwd()}/www/html/${specific_name}.html`, 'utf-8');

    main_page = main_page
    .replace(/{page_inner}/g, page_inner)
    .replace(/{specific_name}/g, specific_name)
    .replace(/{h1_header}/g, h1_header)
    .replace(/{head_title}/g, head_title)

    res.set('Content-Type', 'text/html');
    res.send(Buffer.from(main_page));
}
