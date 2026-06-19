const Route = require('../../modules/route/route.model');
const{calculatePollutionScore} = require('../../modules/pollution/pollution.service');
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

        const results= await Promise.allSettled(
            routes.map((routes) => calculatePollutionScore(routes._id))
        );

        const succeeded = results.filter((r)=> r.status ==='fulfilled').length;

        const failed = results.filter((r)=> r.status ==='rejected').length; 
        
        logger.info(`Pollution job completed -Success ${succeeded} , Failed ${failed}`);

      results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`Route ${routes[index]._id} failed`, result.reason);
      }
    });

    }catch(error)
    {
     logger.error('Pollution job crashed', error);
    }
}

module.exports= pollutionJob;
