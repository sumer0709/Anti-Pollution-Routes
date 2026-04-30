const axios = require('axios');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_TTL = 30 * 60; // 30 minutes in seconds

exports.getAQI = async (lat, lon) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY || process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    const error = new Error('OpenWeather API key missing.');
    error.statusCode = 500;
    throw error;
  }

  // Check cache first
  const cacheKey = `aqi:${lat}:${lon}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`AQI cache hit for ${cacheKey}`);
      return parseFloat(cached);
    }
  } catch (cacheError) {
    // Cache failure should not block the request
    logger.error('Redis cache error', cacheError);
  }

  // Cache miss — call OpenWeather
  try {
    const response = await axios.get(
      'https://api.openweathermap.org/data/2.5/air_pollution',
      {
        params: { lat, lon, appid: apiKey },
        timeout: 5000,
      }
    );

    const aqi = response.data.list[0].main.aqi;

    // Store in cache
    try {
      await redis.set(cacheKey, aqi, 'EX', CACHE_TTL);
      logger.info(`AQI cached for ${cacheKey}`);
    } catch (cacheError) {
      logger.error('Redis set error', cacheError);
    }

    return aqi;
  } catch (error) {
    if (error.response?.status === 401) {
      const authError = new Error('OpenWeather authentication failed.');
      authError.statusCode = 401;
      throw authError;
    }
    throw error;
  }
};