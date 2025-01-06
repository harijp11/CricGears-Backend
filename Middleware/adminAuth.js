const jwt = require("jsonwebtoken");
require("dotenv").config();
const generateAccessToken = require("../utils/genarateAccessToken");
const Admin = require("../Models/adminModel");

const jwtVrification =async (req,res,next)=>{
    try{
        const accessToken=req.cookies.adminAccessToken
        const refreshToken=req.cookies.adminRefreshToken

        if(accessToken){
            const Accessverified=jwt.verify(accessToken,
                process.env.ACCESS_TOKEN_KEY
            )

            const adminData= await Admin.findById(Accessverified.id).select("-password")
            if(!adminData){
                return res
                .status(401)
                .json({message:"Unauthorized:Admin not found"})
            }

            req.Admin=adminData;
            return next()
        }else if(refreshToken){
            const Refreshverified=jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_KEY
            )

            const adminData=await Admin.findById(Refreshverified.id).select("-password");
            if(!adminData){
                return res
                .status(401)
                .json({message:"Unauthorized : Admin not found"})
            }
            const newAccessToken = generateAccessToken(adminData._id)

            res.cookie("adminAccessToken",newAccessToken,{
                httpOnly: true,
                secure: false,
                sameSite: "Strict",
                maxAge: 15 * 60 * 1000,
            })
            req.Admin=adminData
            return next()
        }

        return res
        .status(401)
        .json({
            message:"Unauthorized:No valid token found"
        })
    }catch(err){
        console.log(err);
        return res
        .status(401)
        .json({message:"Unauthorized: Token verification failed"})
    }
}

module.exports={
    jwtVrification,
}