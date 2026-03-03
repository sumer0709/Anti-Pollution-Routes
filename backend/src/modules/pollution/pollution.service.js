const Route = require('../route/route.model');
const PollutionScore = require('./pollution.model.js');
const {getAQI} = require('../../services/aqi.service.js');

exports.calculatePollutionScore = async (routeId) => {
    const route = await Route.findById(routeId);
    const samplePoints = route.polyline.slice(0,5);

    const aqiValues = await Promise.all(samplePoints.map(point => getAQI(point.lat, point.lon)));

    const averageAQI = aqiValues.reduce((sum, aqi) => sum + aqi, 0) / aqiValues.length;

    const finalScore = averageAQI; // You can apply any additional weighting or adjustments here

  const pollution = await PollutionScore.create({
    routeId,
    timestamp: new Date(),
    aqiAverage: averageAQI,
    finalScore
  });

  return pollution;
};