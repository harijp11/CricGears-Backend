const User =require('../../Models/userModel.js') 
const otpSchema=require( "../../Models/otpModel.js")
const otpEmailTemplate=require("../../utils/emailTemplate.js") 
const  generateAccessToken = require("../../utils/genarateAccessToken.js")
const genarateRefreshToken=require ("../../utils/genarateRefreshToken.js")
const {mailSender} =require("../../utils/nodeMailer.js")
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const inserMoneytoWallet = require("../../utils/insertMoneytowallet.js")


const sendOtp=async(req,res)=>{
  try{
    const {email}=req.body
    const checkExist=await User.findOne({email})
    if(checkExist){
        return res.status(409)
        .json({success:false,message:"email already exist"})
    }
    const otpexist = await otpSchema.findOne({email})

    if(otpexist){
      await otpexist.deleteOne({email})
    }
    
    const otp = otpGenerator.generate(5, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      console.log("otp verunnu",otp)
      
      await otpSchema.create({email,otp});
      const {subject,htmlContent}=otpEmailTemplate(otp)
      const mailRes=await mailSender(email,subject,htmlContent)
      return res.status(200)
      .json({success:true,message:"OTP Send successfully",otp})

  }catch(err){
    console.log(err);
    res.json({message:"error"})
  }
}


const register = async (req, res) => {
  try {
    const { name, email, phone, password, usedReferal } = req.body;
    const referalCode = `CG${[...Array(6)]
      .map(() => Math.random().toString(36).charAt(2).toUpperCase())
      .join("")}`;

    const referalAmount = 200;
// console.log(req.body);

    // if (usedReferal) {
      const ReferalUserData = await User.findOne({ referralCode: usedReferal });
      // if (!ReferalUserData) {
      //   return res.status(404).json({ 
      //     success: false, 
      //     message: "Invalid referal code" 
      //   });
      // }
    // }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      referralCode:referalCode,
    });

    if (ReferalUserData) {
      newUser.usedReferral = true;
      await newUser.save();
      // Uncomment when ready to implement wallet functions
      await inserMoneytoWallet(referalAmount, newUser._id);
      await inserMoneytoWallet(referalAmount, ReferalUserData._id);
    }

    return res.status(200).json({
      success: true,
      message: "You are registered successfully"
    });

  } catch (err) {
    console.error("Registration failed:", err);
    return res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
};

const login= async(req,res)=>{
    try{
      

        const {email,password}=req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }
        const userData=await User.findOne({email:email})
        if(!userData){
            return res.status(404).json({
                success:false,
                message:"Email not registered"
            })
        }
        const matchPass= await bcrypt.compare(password,userData.password)
        if(matchPass){
            if(userData.isActive==false){
                const message=`Your account is currently inactive, and access to the website is restricted...!`;
        return res.status(403).json({ success: false, message });
            }
            userData.password=undefined

            const accessToken=generateAccessToken(userData._id)
            const refreshToken=genarateRefreshToken(userData._id)

            res.cookie("accessToken",accessToken,{
                httpOnly: true,
                secure: false,
                sameSite: "Strict",
                maxAge: 15 * 60 * 1000, 
            })

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: "Strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration for refresh token
              })
              return res.status(200).json({
                success:true,
                message:"Login successfull",
                userData,
              })
        }
        return res.status(401).json({
            success:false,
            message:"Invalid credentials"
        })
    }catch(err){
        console.log("Unexpected error during login:",err);
        return res.status(500).json({
          success:false,
          message:"Internal server error.please try again later.",
        })
    }
}


const { OAuth2Client } = require('google-auth-library');
const generateRefreshToken = require('../../utils/genarateRefreshToken.js')
const client = new OAuth2Client({
  clientId: process.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET_KEY
});

const googleAuth = async (req, res) => {
    try {
      // console.log("Received request body:", req.body);
      const { token } = req.body;
      const referalCode = `CG${[...Array(6)]
        .map(() => Math.random().toString(36).charAt(2).toUpperCase())
        .join("")}`;  
      if (!token) {
        console.log("No token found in request");
        return res.status(400).json({ 
          success: false, 
          message: 'No token provided' 
        });
      }
      console.log("Attempting to verify token...");
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.VITE_GOOGLE_CLIENT_ID
      });
      
      const payload = ticket.getPayload();
      const { sub, email, name } = payload;
  
      // Find or create user
      let user = await User.findOne({ 
        $or: [
          { email: email },
          { googleId: sub }
        ]
      });
      
      if (!user) {
        // Create new user with Google OAuth details
        user = new User({
          googleId: sub,
          email: email,
          name: name,
          isActive: true,
          referralCode:referalCode,
          // Omit password for Google OAuth users
          password: undefined 
        });
        await user.save();
      } else {
        // Update existing user if needed
        if (!user.googleId) {
          user.googleId = sub;
          await user.save();
        }
      }
  
      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);
  
      // Set cookies
      res.cookie('accessToken', accessToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
  
      res.cookie('refreshToken', refreshToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
  
      // Respond with user data
      res.status(200).json({ 
        success: true, 
        user: { 
          _id: user._id, 
          email: user.email, 
          name: user.name,
          phone:user.phone,
          isGoogleUser: !!user.googleId,
        },
        message: "Google authentication successful"
      });
  
    } catch (error) {
      console.error('Detailed Google Auth Error:', error);
      
      res.status(400).json({ 
        success: false, 
        message: 'Authentication failed',
        errorDetails: error.message 
      });
    }
  };

  const logout = (req, res) => {
    try {
      // Clear accessToken cookie
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
  
      // Clear refreshToken cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
  
      // Send successful logout response
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error during logout'
      });
    }
  };

  async function forgotPassword(req,res){
    try{
      const {email} = req.body;
      const checkExist=await User.findOne({email:email})
       
      if(!checkExist){
        return res
        .status(404)
        .json({
          success: false,
          message: 'Email not found please signup',
        })
      }
      const otpexist = await otpSchema.findOne({email})

    if(otpexist){
      await otpexist.deleteOne({email})
    }
      const otp=otpGenerator.generate(5,{
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      })
      await otpSchema.create({ email, otp });
      const { subject, htmlContent } = otpEmailTemplate(otp);

      const mailRes=await mailSender(email,subject,htmlContent)

      return res
      .status(200)
      .json({success:true,message:"OTP sended successfully",otp})
    }catch(err){
      console.log(err);
      
    }
  }

  async function forgotPasswordOtpVerification(req,res){
    try{
      const {email}=req.body
      const userData = await User.findOne({email:email})
      if(!userData){
        return res
        .status(404)
        .json({
          success: false,
          message: 'Email not found please signup',
        })
      }

      return res
      .status(200)
      .json({
        success: true,
        message: 'OTP verification successful',
        _id: userData._id,
      })
    }catch(err){
      console.log(err);
    }
  }

  async function resetPassword(req,res){
     try{
      const { newPassword,confirmPassword,_id}=req.body
      if(newPassword!==confirmPassword){
        return res
        .status(400)
        .json({success:false,message:"Password not matching"})
      }
      const hashedPassword=await bcrypt.hash(newPassword,10)

      const updatedData=await User.findByIdAndUpdate(
        {_id},
        {password:hashedPassword},
        {new:true}
      )

      if(!updatedData){
        return res
        .status(404)
        .json({
          success:false,
          message:"unable to reset"
      })
      }
      return res
      .status(200)
      .json({
        success:true,
        message:"Password reseted successfully"
      })
     }catch(err){
      console.log(err);
      return res
      .status(500)
      .json({
        success:false,
        message:"internal server error"
      })
     }
  }


  const editUser=async(req,res)=>{
    try {
      const {userId,name,email,phone}=req.body
      // console.log("userid is here",userId);
      
      const user=await User.findByIdAndUpdate(

        {_id:userId},
        {
          name,email,phone
        },
        {new:true}
      )

      if(!user){
        return res
        .status(400)
        .json({success:false,message:"User not found"})
      }
      return res
      .status(200)
       .json({success:true,message:"User updated successfully",user})
     }catch(err){
       console.log(err);  
    }
  }

const changePassword=async(req,res)=>{
  try{
     const {_Id,currentPassword,newPassword,confirmPassword}=req.body
     const user=await User.findById({_id:_Id});
     const passwordMatch= await bcrypt.compare(currentPassword,user.password)
     console.log(passwordMatch);
     if(!passwordMatch){
      return res
      .status(400)
      .json({success:false,message:"Invalid current password"})
     }
     if(newPassword!==confirmPassword){
      return res
      .status(400)
      .json({success:false,message:"Passwords do not match"})
     }
     const hashedPassword=await bcrypt.hash(newPassword,10)
      user.password=hashedPassword
      await user.save()
      return res
      .status(200)
      .json({
        success:true,
        message:"Password updated successfully",
      })
  }catch(err){
    console.log(err);
  }
}

// async function referal(req,res){
//   try{
//     const {referalCode,_id}=req.body
//     const referalAmount = 200

//     const ReferalUserData = await User.findOne({referalCode:referalCode})
//     if(!ReferalUserData){
//       return res
//       .json(404)
//       .json({success:false,message:"Invalid referal code"})
//     }

//     // inserMoneytoWallet(referalAmount, _id);
//     // //Add Referal Reward to Refered User
//     // inserMoneytoWallet(referalAmount, RefereduserData._id);

//     const updatedUser = await User.findByIdAndUpdate({_id: ReferalUserData._id},
//       {userReferral:true}, 
//       {new: true})
//       updatedUser.password = undefined;
//       return res.status(200).json({
//         success: true,
//         message: "successfuly Collected the Referal reward to The Wallet",
//         updatedUser,
//       });
//   }catch(err){
//     console.log(err);
//   }
// }


module.exports={
    sendOtp,
    register,
    login,
    googleAuth,
    logout,
    editUser,
    forgotPassword,
    forgotPasswordOtpVerification,
    resetPassword,
    changePassword,
    // referal,
}