const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../utils/logger');

async function connectDb(){
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Connected to MongoDB');
    }catch(error){
        logger.error('Error connecting to MongoDB', error);
    }
}
module.exports = connectDb;