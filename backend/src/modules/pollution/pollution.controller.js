const {calculatePollution} = require('./pollution.service');
const {getAQI} = require('../../services/aqi.service.js');

exports.calculate=async(req,res)=>{
  try {
    const result = await calculatePollution(req.params.routeId);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to calculate pollution"
    });
  }
};
exports.testAQI = async (req, res) => {
  try {
    const aqi = await getAQI(20.2961, 85.8245);
    res.json({ aqi });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to fetch AQI"
    });
  }
};
