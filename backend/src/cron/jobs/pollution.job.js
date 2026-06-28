const Route = require('../../modules/route/route.model');
const { getChannel } = require('../../config/rabbitmq');
const { POLLUTION_QUEUE } = require('../../config/queue');
const { calculatePollutionScore } = require('../../modules/pollution/pollution.service');
const logger = require('../../utils/logger');

const pollutionJob= async ()=>{
    logger.info('Pollution job started..');
    try{
        const routes = await Route.find({});
        logger.info(`Found ${routes.length} routes to process`);

        if(!routes.length)
        {
            logger.info('No routes found.Skipping jobs');
            return;
        }

      const channel = await getChannel();

      if (!channel)
      {
        logger.error("RabbitMQ channel not available. Skipping job");
        return;
      }

      await channel.assertQueue(POLLUTION_QUEUE, { durable: true });

      let published = 0;
      for(const route of routes)
      {
        const message = JSON.stringify({ routeId: route._id });
        await channel.sendToQueue(POLLUTION_QUEUE, Buffer.from(message), {
          persistent: true,
        });
        published++;
      }
      logger.info(`Pollution job completed — ${published} messages published to queue`);
    }catch(error)
    {
     logger.error('Pollution job crashed', error);
    }
}

module.exports= pollutionJob;
