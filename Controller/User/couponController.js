const Coupon = require("../../Models/couponModel");
const HttpStatusCode = require("../../shared/httpStatusCodes");
const { CommonErrorMessages } = require("../../shared/messages");

async function fetchCouponDetails(req,res){
    try{
    const {couponCode} = req.query

    const couponData = await Coupon.findOne({code:couponCode})
     
    if(!couponData){
        return res.status(404)
        .json({
            success:false,
            message:"Coupon Not found",
        })
    }
    return res
    .status(200)
    .json({ message: "couponData fetched successfully", CouponData:couponData });
    }catch(err){
      console.log(err)
       return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
          });
    }
}

async function updateCoupon(req,res){
    try{
      const {coupon_id, user_id } = req.body
      const couponData = await Coupon.findOne({_id:coupon_id})

      let userFound = false

      if(couponData.usersApplied === 0){
        const appliedUser = {user:user_id,user_count:1}
        couponData.usersApplied.push(appliedUser)
      }else{
        couponData.usersApplied.forEach((usersApplied)=>{
            if(usersApplied.user.toString() === user_id){
                usersApplied.used_count += 1;
                userFound= true
            }
        })

        if(!userFound){
            const appliedUser = {user:user_id , user_count:1};
            couponData.usersApplied.push(appliedUser)
        }
      }

      await couponData.save()
    }catch(err){
        console.log("Error updating coupon:", err); 
         return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
              success: false,
              message: CommonErrorMessages.INTERNAL_SERVER_ERROR,
            });
    }
}

module.exports = {
    fetchCouponDetails,
    updateCoupon,
}