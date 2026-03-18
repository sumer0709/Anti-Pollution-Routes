const UserRoute = require('../users/user.model.js')
const {validateLogin , validateRegister} = require('../../validations/validations.js');
const logger = require('../../utils/logger.js')
const generateTokens = require('../../utils/generateToken.js');

const setTokenCookies = (res , accessToken , refreshToken)=>{
    res.cookie('accessToken' , accessToken ,
        {
           httpOnly: true,      // JS can't access it (XSS protection)
           secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
           sameSite: 'strict',  // CSRF protection
           maxAge: 15 * 60 * 1000, // 15 minutes (match your JWT expiry)
        });
    res.cookie('refreshToken' , refreshToken,
        {
           httpOnly: true,      // JS can't access it (XSS protection)
           secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
           sameSite: 'strict',  // CSRF protection
           maxAge: 7*24*60*60*1000,
        });

};


exports.register = async(req,res)=>{
    logger.info("Register end point hit....");
    try{
        const {error} = validateRegister(req.body);

        if(error)
        {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });            
        }

        const { name , email , password } = req.body;

        const userExists = await UserRoute.findOne({
            $or:[{email} , {name}]
        });

        if(userExists)
        {
            logger.warn("User already exists")
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });            
        }

        const newUser = new UserRoute({name , email , password});

        await newUser.save();
        const {accessToken , refreshToken} = await generateTokens(newUser);

        setTokenCookies(res , accessToken , refreshToken);

        return res.status(201).json({
          success: true,
          message: 'User registered successfully',
          accessToken
         });        

    }catch(e)
    {
     logger.warn("Error in register endpoint ..." , e);
     return res.status(500).json({
        success:false,
        message:'Internal server error'
     });
    }
}