'use strict';

const router = require('express').Router();
const controllers = require('./../controllers');

/* GET API's home page. */
router.get('/', controllers.root);
router.get('/favicon.ico', controllers.ico);
/* GET */

router.get('/reports', controllers.reports.page_load);

module.exports = router;