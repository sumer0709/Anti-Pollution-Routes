const Joi = require('joi');

const coordinateSchema = Joi.object({
    lat:Joi.number().min(-90).max(90).required(),
    lng:Joi.number().min(-180).max(180).required(),
});

const createRouteSchema=Joi.object({
    startLocation: coordinateSchema.required(),
    endLocation: coordinateSchema.required(),
    polyline:Joi.array().items(coordinateSchema).min(2).max(100).required(),
    routeType:Joi.string().valid('commute', 'jogging', 'cycling').required()
});

module.exports = { createRouteSchema };