const mongoose = require('mongoose');

const pollutionSchema = new mongoose.Schema({
    routeId:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Route',
        index : true,
        required : true
    },
    aqiAverage: {
       type: Number,
       required : true,
    },
    finalScore: {
        type : Number,
        required: true,
    },
},{timestamps :  true , 
    toJSON:{
      transform:(doc ,ret)=>{
        delete ret.__v;
        return ret;
      }
    },
},
);
module.exports = mongoose.model('PollutionScore', pollutionSchema);