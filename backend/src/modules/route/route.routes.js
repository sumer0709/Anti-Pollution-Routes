const router = require('express').Router();
const controller = require('./route.controller');

router.post('/', controller.createRoute);
router.get('/', controller.getRoutes);

module.exports = router;