const Route = require('../route/route.model');
const PollutionScore = require('./pollution.model.js');
const {getAQI} = require('../../services/aqi.service.js');

const calculatePollutionScore = async (routeId) => {
    const route = await Route.findById(routeId);
    if (!route) {
        const error = new Error('Route not found');
        error.statusCode = 404;
        throw error;
    }

    const samplePoints = route.polyline.slice(0,5);
    if (!samplePoints.length) {
        const error = new Error('Route has no polyline points');
        error.statusCode = 400;
        throw error;
    }

    const aqiValues = await Promise.all(
      samplePoints.map((point) => getAQI(point.lat, point.lon ?? point.lng))
    );

    const averageAQI = aqiValues.reduce((sum, aqi) => sum + aqi, 0) / aqiValues.length;

    const finalScore = (averageAQI/5)*100; // You can apply any additional weighting or adjustments here

  const pollution = await PollutionScore.create({
    routeId,
    timestamp: new Date(),
    aqiAverage: averageAQI,
    finalScore
  });

  return pollution;
};

exports.calculatePollutionScore = calculatePollutionScore;

