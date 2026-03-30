const mongoose = require('mongoose');

const coordinateSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startLocation: {
      type: coordinateSchema,
      required: true,
    },
    endLocation: {
      type: coordinateSchema,
      required: true,
    },
    polyline: {
      type: [coordinateSchema],
      required: true,
      validate: {
        validator: (val) => val.length >= 2 && val.length <= 100,
        message: 'Polyline must contain between 2 and 100 points.',
      },
    },
    routeType: {
      type: String,
      enum: ['commute', 'jogging', 'cycling'],
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON:{
      transform:(doc ,ret)=>{
        delete ret.__v;
        return ret;
      }
    },
  }
);

module.exports = mongoose.model('Route', routeSchema);