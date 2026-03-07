const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'UserRoute'
    },
    name : String,
    startlocation:{
        lat:Number,
        lng:Number
    },
    endLocation:{
        lat:Number,
        lng:Number
    },
    polyline:[{
       lat: Number,
       lng: Number
    }],
    routeType:{
        type: String,
        enum: ['jogging', 'cycling', 'walking']
    }
},{timestamps:true});

const Route = mongoose.model('Route', routeSchema);
module.exports = Route;