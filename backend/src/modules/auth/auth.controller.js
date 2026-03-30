const User = require('../users/user.model.js')
const {validateLogin , validateRegister} = require('../../validations/validations.js');
const logger = require('../../utils/logger.js')
const generateTokens = require('../../utils/generateToken.js');
const RefreshToken = require('./RefreshToken.js');

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

        const userExists = await User.findOne({
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

        const newUser = new User({name , email , password});

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

exports.login=async(req,res)=>{
    logger.info("Login endpoint hit..")
    try{
        const {error} = validateLogin(req.body);

        if(error)
        {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });  
        }

        const {email , password}= req.body;
        const user = await User.findOne({email});

        if(!user)
        {
            logger.warn("Inavlid user attempt")
            return res.status(400).json({
                success: false,
                message: "Inavlid credentials"
            });
        }
        const isValidPassword = await user.comparePassword(password);

        if(!isValidPassword)
        {
            logger.warn("Invalid Credentials");
            return res.status(400).json({
                success:false,
                message:"Invalid credentials"
            });
        }
        const {accessToken , refreshToken} = await generateTokens(user);

        setTokenCookies(res , accessToken , refreshToken);

          return res.status(200).json({
          success: true,
          message: 'User logged in successfully',
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

exports.refreshToken=async(req,res)=>{
    logger.info("Refresh Token endpoint hit ... ");
    try {
        const refreshToken= req.cookies.refreshToken;

        if(!refreshToken)
        {
            logger.warn("Refresh token missing");
            return res.status(400).json({
                success:false,
                message:'Refresh token missing'
            });
        }

        const storedToken= await RefreshToken.findOne({token:refreshToken});
        if(!storedToken || storedToken.expiresAt < new Date()){
            logger.warn("Invalid or expired refresh token");
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }
        
        const user =  await User.findById(storedToken.user);
     if (!user) {
        logger.warn("User not found");

        return res.status(401).json({
            success: false,
            message: "User not found",
        });
     }
        const {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        } = await generateTokens(user);    
       await RefreshToken.deleteOne({ _id: storedToken._id });
       setTokenCookies(res , newAccessToken , newRefreshToken); 
             return res.status(200).json({
            success: true,
            accessToken: newAccessToken,  // for Postman/mobile
        });
        
       
    } catch (e) {
        logger.error("Error in refresh token endpoint ..." , e);
        return res.status(500).json({
            success:false,
            message:'Internal server error'
        });
    }
}
exports.logout = async(req,res)=>{
    logger.info("Logout endpoint hit..")
    try{

        // Read from cookie first, fallback to body (for Postman)
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if(!refreshToken){
            logger.warn("Refresh token missing");
            return res.status(400).json({
                success: false,
                message: "Refresh token missing"
            });
        }

        // Delete token from DB (invalidate session)
        await RefreshToken.deleteOne({ token: refreshToken });
        logger.info("Refresh token deleted during logout");

        // Clear cookies from browser
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }catch(e){
        logger.error("Error in logout endpoint ..." , e);
        return res.status(500).json({
            success:false,
            message:'Internal server error'
        });
    }
}