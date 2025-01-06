const mongoose =require("mongoose")

const categorySchema=new mongoose.Schema({
  name:{
    type:String,
    required:true,
    trim:true,
  },
  description:{
    type:String,
    trim:true,
  },
  isActive:{
    type:Boolean,
    default:true
  },
  offer:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Offer",
  },
  createdAt:{
    type:Date,
    default:Date.now,
  },
updatedAt:{
    type:Date,
    default:null,
},
})

module.exports=mongoose.model("Category",categorySchema)