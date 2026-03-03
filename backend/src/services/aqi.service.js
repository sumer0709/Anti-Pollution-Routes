const axios = require("axios");

exports.getAQI=async(lat, lon) => {
    const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution`,
        {
            params: {
                lat: lat,
                lon: lon,
                appid: process.env.OPENWEATHERMAP_API_KEY
            }
        }
    );
    return response.data.list[0].main.aqi;
};