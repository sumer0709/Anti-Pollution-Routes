const Route = require('./route.model.js');
const logger = require('../../utils/logger.js');
exports.createRoute = async (req, res) => {
 logger.info('Creating a new route');
 try{
 const route = await Route.create(req.body);
 res.status(201).json(route);
 }catch(err){
 logger.error('Error creating route:', err);
 res.status(500).json({error: 'Failed to create route'});
 }
};

exports.getRoutes = async (req, res) => {
logger.info('Fetching all routes');
 try {
    const routes = await Route.find().populate('userId', 'username');
    res.status(200).json(routes);
 } catch (error) {
    logger.error('Error fetching routes:', error);
    res.status(500).json({error: 'Failed to fetch routes'});
 }

};