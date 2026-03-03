const router = require('express').Router();
const controller = require('./routes.controller');

router.post('/', controller.createRoute);
router.get('/', controller.getRoutes);

module.exports = router;