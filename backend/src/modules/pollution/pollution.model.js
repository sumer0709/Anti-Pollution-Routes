const mongoose = require('mongoose');

const pollutionSchema = new mongoose.Schema({
    routeId:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Route',
    },
    timestamp: Date,
    aqiAverage: Number,
    finalScore: Number,
});
module.exports = mongoose.model('PollutionScore', pollutionSchema);