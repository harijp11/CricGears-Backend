const bcrypt =require("bcrypt")
const Admin =require("../../Models/adminModel")
const generateAccessToken = require("../../utils/genarateAccessToken");
const generateRefreshToken = require("../../utils/genarateRefreshToken")

async function createAdmin(req,res){
      try{
        const adminPassword="admin"
        const hashedPassword= await bcrypt.hash(adminPassword,10)

        const admin = await Admin.create({
            email:req.params.email,
            password:hashedPassword,
            role:"admin",
        })
        // console.log("Admin user created successfully")
      }catch(err){
          console.log("admin login error",err)
      }
}

async function login(req,res){
    try{
        const {email,password}=req.body

        const adminData= await Admin.findOne({email})
        if(!adminData){
            return res
            .status(401)
            .json({
              success:false,
              message:"Not a admin or inavalid credentials",
            })
        }
        const matchPass= await bcrypt.compare(password,adminData.password)
        if(!matchPass){
            return res
            .status(401)
            .json({
                success:false,
                message:"Not a admin or inavalid credentials",
            })
        }
        if(adminData.role != "Admin"){
            return res.status(401).json({
                success:false,
                message:"Not a admin or inavalid credentials",
            })
        }

    const accessToken = generateAccessToken(adminData._id);
    const refreshToken = generateRefreshToken(adminData._id);

    res.cookie("adminAccessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("adminRefreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    adminData.password = undefined;
    return res.status(200).json({
      success: true,
      message: "Login Successful, Welcome Back",
      adminData,
    });
    }catch(err){
        console.error("Unexpected error during login:", err);
        return res.status(500).json({
          success: false,
          message: "Internal server error. Please try again later.",
        });
    }
} 

const logout = (req, res) => {
  try {
    // Clear accessToken cookie
    res.clearCookie('adminAccessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Clear refreshToken cookie
    res.clearCookie('adminRefreshToken', {
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



module.exports={
    createAdmin,
    login,
    logout,
}