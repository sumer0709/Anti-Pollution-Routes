const axios = require("axios");

exports.getAQI=async(lat, lon) => {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY || process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
        const error = new Error("OpenWeather API key missing. Set OPENWEATHERMAP_API_KEY or OPENWEATHER_API_KEY.");
        error.statusCode = 500;
        throw error;
    }

    try {
    const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution`,
        {
            params: {
                lat: lat,
                lon: lon,
                appid: apiKey
            }
        }
    );
    return response.data.list[0].main.aqi;
    } catch (error) {
        if (error.response?.status === 401) {
            const authError = new Error("OpenWeather authentication failed (401). Check your API key value.");
            authError.statusCode = 401;
            throw authError;
        }
        throw error;
    }
};
