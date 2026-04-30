const { calculatePollutionScore } = require('./pollution.service');
const { getAQI } = require('../../services/aqi.service');
const logger = require('../../utils/logger');

exports.calculate = async (req, res) => {
  logger.info('Calculate pollution endpoint hit...');
  try {
    const result = await calculatePollutionScore(req.params.routeId);
    return res.status(200).json({
      success: true,
      message: 'Pollution score calculated successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error calculating pollution score', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to calculate pollution score',
    });
  }
};

exports.testAQI = async (req, res) => {
  logger.info('Test AQI endpoint hit...');
  try {
    const aqi = await getAQI(20.2961, 85.8245);
    return res.status(200).json({
      success: true,
      data: { aqi },
    });
  } catch (error) {
    logger.error('Error fetching AQI', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to fetch AQI',
    });
  }
};