'use strict';

const router = require('express').Router();
const controllers = require('./../controllers');

/* GET API's home page. */
router.get('/', controllers.root);
router.get('/favicon.ico', controllers.ico);
/* GET */

router.get('/reports', controllers.reports.page_load);
router.get('/datasource', controllers.datasource.page_load);
router.get('/builder/onepage', controllers.onepage.page_load);
router.get('/builder/report', controllers.report.page_load);

router.get('/report/get_datasources', controllers.report.get_datasources);
router.post('/datasource/save', controllers.datasource.save);

module.exports = router;