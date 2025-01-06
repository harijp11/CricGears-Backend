const mongoose=require("mongoose")

const otpSchema=({
    email:{
        type:String,
        required:true,
        trim:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:60*2,
    },
})

module.exports=mongoose.model("otpSchema",otpSchema)