const { type } = require("express/lib/response");
const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
    {
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        name:{
            type:String,
            required:true,
        },
        email:{
            type:String,
            required:true,
        },
        phone:{
            type:Number,
            required:true,
        },
        address:{
            type:String,
            required:true,
        },
        landmark:{
           type:String,
           required:true,
        },
        pincode:{
            type:Number,
            required:true, 
        },
        city:{
            type:String,
            required:true,
        },
        district:{
            type:String,
            required:true,
        },
        state:{
            type:String,
            required:true,
        }
    },
    {
        timestamps:true
    }
)

module.exports = mongoose.model("Address",AddressSchema)