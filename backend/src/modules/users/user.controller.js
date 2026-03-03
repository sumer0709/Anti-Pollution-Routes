const User = require('./user.model');
const logger = require('../../utils/logger');
exports.createUser=async(req,res)=>{
    logger.info("Create User end point hit ..")
    try {
        const user = await User.create(req.body);
        res.json(user);
    } catch (error) {
        logger.error("Error creating user: ", error);
        res.status(500).json({ error: 'Failed to create user' });
    }
}
exports.getUsers=async(req,res)=>{
    logger.info("Get Users end point hit ..");
    try{
        const users = await User.find();
        res.json(users);
    } catch (error) {
        logger.error("Error fetching users: ", error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}