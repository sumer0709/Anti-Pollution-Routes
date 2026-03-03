const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = 'logs';

// Create logs directory if not exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const { combine, timestamp, printf, errors, json, colorize } = winston.format;

// Custom log format for development
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}] : ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }) // Capture stack trace
  ),

  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: combine(json())
    }),

    // All logs file
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: combine(json())
    })
  ]
});

// Console transport (only if not production)
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        devFormat
      )
    })
  );
}

module.exports = logger;