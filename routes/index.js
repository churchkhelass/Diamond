'use strict';

const router = require('express').Router();
const controllers = require('./../controllers');

// router.post('/', root_controller.init);
/* GET API's home page. */
router.get('/', controllers.root);
router.get('/favicon.ico', controllers.ico);

/* GET */
// router.get('/recalc', controllers.cmd.recalc);
// router.get('/init', controllers.cmd.init);
// router.get('/log', controllers.cmd.log);
// router.get('/in_progress', controllers.cmd.in_progress);

/* POST */

module.exports = router;