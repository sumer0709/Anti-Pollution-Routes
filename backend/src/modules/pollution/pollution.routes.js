const router = require('express').Router();
const pollutionController = require('./pollution.controller.js');


router.post('/:routeId/calculate', pollutionController.calculate);
router.get('/test-aqi', pollutionController.testAQI);

module.exports = router;
