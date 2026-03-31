const Route = require('./route.model');
const logger = require('../../utils/logger');
const mongoose= require('mongoose');
exports.createRoute = async (req, res) => {
  logger.info('Create route endpoint hit...');
  try {
    const { startLocation, endLocation, polyline, routeType } = req.body;

    const route = new Route({
      user: req.user._id,
      startLocation,
      endLocation,
      polyline,
      routeType,
    });

    const savedRoute = await route.save();

    return res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: savedRoute,
    });
  } catch (error) {
    logger.error('Error creating route', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

exports.getRoutes= async (req,res)=>{
  logger.info("Get Routes endpoint hit...")
  try{
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 50);
    const startIndex= (page-1)*limit;
    const [routes , totalRoutes] = await Promise.all([Route.find({user: req.user._id}).select('-polyline').sort({createdAt:-1}).skip(startIndex).limit(limit),Route.countDocuments({user:req.user._id})]);
    const totalPages= Math.ceil(totalRoutes / limit);

    if (page > totalPages && totalRoutes > 0) {
  return res.status(400).json({
    success: false,
    message: `Page ${page} does not exist. Total pages: ${totalPages}`,
  });
  };
      return res.status(200).json({
      message:"Found routes of this id",
      success: true,
      data: {
        routes,
        currentPage: page,
        totalPages,
        totalRoutes,
      },
    });
  }catch(e)
  {
    logger.error("Error fetching Routes", e);

      // Send error response
      res.status(500).json({
      success: false,
      message: "Error at fetching Routes",
      });
  }
}

exports.getRoutesById= async (req,res)=>{
  logger.info("Get Routes By Id endpoint hit ..")
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id))
    {
      return res.status(404).json({
        message:"Invalid Route Id",
        success:false
      });
    }
    const route = await Route.findOne({_id: req.params.id , user:req.user._id});
    if(!route)
    {
     logger.warn("Route not found .. ");
     return res.status(400).json({
      message:"Route not found",
      success:false
     });
    }
    logger.info("Route found by id", route._id);
    return res.status(200).json({
      route,
      message:"Route found",
      success:true
    });

  } catch (e) {
    logger.error("Error fetching Route", e);

      // Send error response
      res.status(500).json({
      success: false,
      message: "Error at fetching Route",
      });    
  }
}
exports.deleteRoute= async(req,res)=>{
  logger.info("Delete route end point hit..");
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
       return res.status(400).json({
        message:"Invalid Route Id",
        success:false
      });
    }

    const route = await Route.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if(!route)
    {
     logger.warn("Route not found .. ");
     return res.status(404).json({
      message:"Route not found",
      success:false
     });
    }
    logger.info("Route found and deleted id", route._id);
    return res.status(200).json({
      message:"Route deleted sucessfully",
      success:true
    });

  } catch (e) {
    logger.error("Error fetching Route", e);

      // Send error response
      res.status(500).json({
      success: false,
      message: "Error at fetching Route",
      }); 
  }
}