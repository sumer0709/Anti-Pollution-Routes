const Route = require('../route/route.model');
const PollutionScore = require('./pollution.model');
const { getAQI } = require('../../services/aqi.service');
const logger = require('../../utils/logger');

const SAMPLE_RATE = 10;

const calculatePollutionScore = async (routeId) => {
  const route = await Route.findById(routeId);
  if (!route) {
    const error = new Error('Route not found');
    error.statusCode = 404;
    throw error;
  }

  // Sample evenly across polyline
  const samplePoints = route.polyline.length <= SAMPLE_RATE
    ? route.polyline
    : route.polyline.filter((_, i) => i % SAMPLE_RATE === 0);

  if (!samplePoints.length) {
    const error = new Error('Route has no polyline points');
    error.statusCode = 400;
    throw error;
  }

  logger.info(`Sampling ${samplePoints.length} points from polyline of ${route.polyline.length}`);

  // Fetch AQI for all sampled points in parallel
  const aqiValues = await Promise.all(
    samplePoints.map((point) => getAQI(point.lat, point.lng))
  );

  // Calculate average AQI
  const aqiAverage = aqiValues.reduce((sum, aqi) => sum + aqi, 0) / aqiValues.length;

  // Normalize score — higher is better
  const finalScore = ((5 - aqiAverage) / 5) * 100;

  logger.info(`Route ${routeId} — AQI average: ${aqiAverage}, Score: ${finalScore}`);

  const pollution = await PollutionScore.findOneAndUpdate(
  { routeId },
  { aqiAverage, finalScore },
  { upsert: true, returnDocument: 'after' }
  );

  return pollution;
};

exports.calculatePollutionScore = calculatePollutionScore;