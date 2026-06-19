const cron = require('node-cron');
const logger = require('../utils/logger');
const pollutionJob = require('./jobs/pollution.job');

const startScheduler =() =>{
    logger.info('Starting cron scheduler..');

    cron.schedule('*/15 * * * *',async () =>{
        logger.info('Cron triggered - running pollution job');
        await pollutionJob();
    });

    logger.info('Cron scheduler started - pollution job every 15 minutes');
};

module.exports=startScheduler;