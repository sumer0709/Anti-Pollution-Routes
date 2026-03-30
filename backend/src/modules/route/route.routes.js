const router = require('express').Router();
const controller = require('./route.controller');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const { createRouteSchema } = require('./route.validations.js');

router.post('/', authenticate, validate(createRouteSchema), controller.createRoute);
router.get('/', authenticate, controller.getRoutes);
router.get('/:id', authenticate, controller.getRoutesById);

module.exports = router;