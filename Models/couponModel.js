const mongoose = require("mongoose")

const coupon_schema = new mongoose.Schema({
    code:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        uppercase:true,
    },
    description:{
        type:String,
    },
    discountValue:{
        type:Number,
        required:true,
        min:[0,"Discount value cannot be negative"]
    },
    minPurchaseAmount:{
        type:Number,
        default:null,
        min: [0, "Minimum purchase amount cannot be negative"],
    },
    maxDiscountAmount:{
        type:Number,
        default:null,
        min: [0, "Maximum discount amount cannot be negative"],
    },
    expirationDate:{
        type:Date,
        required:true
    },
    usageLimit:{
        type:Number,
        default:1,
        min: [1, "Usage limit must be at least 1 if specified"],
    },
    usersApplied:[
        {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "user",
            },
            used_count: {
              type: Number,
              default: 1,
              min: [0, "Used count cannot be negative"],
            },
          },
    ],
    isActive:{
        type:Boolean,
        default:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
updatedAt:{
  type:Date,
  default:Date.now,
}
    
})

coupon_schema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });
// Middleware to update `updatedAt` before saving
coupon_schema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("coupon",coupon_schema)