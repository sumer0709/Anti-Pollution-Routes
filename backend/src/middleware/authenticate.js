const jwt = require('jsonwebtoken');
const User = require('../modules/users/user.model');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    // Extract token from cookie or Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      logger.warn('No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Attach user to request
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      logger.warn('User not found for token');
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    req.user = user;
    next();

  } catch (error) {
    logger.warn('Invalid or expired token', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

module.exports = authenticate;