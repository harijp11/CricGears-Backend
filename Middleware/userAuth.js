const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');
const OTP = require('../Models/otpModel');
const  generateAccessToken  = require('../utils/genarateAccessToken');
require('dotenv').config();

const verifyOtp = async (req, res, next) => {
  try {
    const { otp, email } = req.body;
    console.log("email==t6w5geythythytth",email);
    
    const otpData = await OTP.findOne({ email });
    console.log('OTP Data Found:', otpData)
    if (!otpData){
      return res.status(404).json({ success: false, message: "OTP not found" });
    }
    
    if (otp === otpData.otp){
      await OTP.deleteOne({ email }); // Clean up used OTP
      next();
    } else {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const jwtVerification = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (accessToken) {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
      }
      
      req.user = user;
      next();
    } else if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized: User not found" });
      }
      
      const newAccessToken = generateAccessToken(user._id);
      
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      
      req.user = user;
      next();
    } else {
      return res.status(401).json({ message: "Unauthorized: No valid tokens found" });
    }
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ message: "Unauthorized: Token verification failed" });
  }
};

async function checkUserBlocked(req,res,next){
  try{
    const {user}=req;
    console.log("+++++++",user)
    const userData=await User.findById(user._id)

    if(!userData){
      return res
      .status(404)
      .json({success:false,message:"User not found"})
    }

    if(userData.isActive===false){
      return res
      .status(403)
      .json({success:false,message:"user is blocked"})
    }
    // console.log("before next");
    next()
    
  }catch(err){
       console.log(err);
       return res
       .status(500)
       .json({success:false,message:"Internal server error"})   
  }
}

module.exports = {
  verifyOtp,
  jwtVerification,
  checkUserBlocked
};

