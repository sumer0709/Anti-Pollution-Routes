const Route = require('./route.model');
const logger = require('../../utils/logger');

exports.createRoute = async (req, res) => {
  logger.info('Create route endpoint hit...');
  try {
    const { startLocation, endLocation, polyline, routeType } = req.body;

    const route = new Route({
      user: req.user._id,
      startLocation,
      endLocation,
      polyline,
      routeType,
    });

    const savedRoute = await route.save();

    return res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: savedRoute,
    });
  } catch (error) {
    logger.error('Error creating route', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};