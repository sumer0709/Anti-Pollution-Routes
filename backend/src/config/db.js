const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../utils/logger');

async function connectDb(){
const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        const error = new Error('MONGODB_URI is not configured');
        logger.error(error.message);
        throw error;
    }

    try{
        await mongoose.connect(mongoUri);
        logger.info('Connected to MongoDB');
    }catch(error){
        logger.error('Error connecting to MongoDB', error);
throw error;
    }
}
module.exports = connectDb;
