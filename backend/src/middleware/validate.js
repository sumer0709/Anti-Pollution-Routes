const logger = require('../utils/logger');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    logger.warn('Validation failed', {
      errors: error.details.map((e) => e.message),
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((e) => e.message),
    });
  }
  next();
};

module.exports = validate;