const router = require('express').Router();
const pollutionController = require('./pollution.controller');
const authenticate = require('../../middleware/authenticate');

router.post('/:routeId/calculate', authenticate, pollutionController.calculate);
router.get('/test-aqi', pollutionController.testAQI);

module.exports = router;