const mongoose=require("mongoose")

const cartSchema = new mongoose.Schema({
  
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    items:[
        {
           productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product",
            required:true
           } ,
           size:{
            type:String,
            required:true,
           },
           stock:{
            type:Number,
            required:true,
            min:0,
           },
           price:{
            type:Number,
            required:true,
            min:0,
           },
           salePrice:{
            type:Number,
            min:0,
            validate:{
                validator:function(val){
                    return val <=this.price
            },
            message:"Sale price should be less than or equal to price",
           },
        },
        qty:{
            type:Number,
            required:true,
            default:1
        },
        totalProductPrice:{
            type:Number,
            required:true,
        },
        discountedAmount:{
            type:Number,
            default:0,
        }
      }
    ],
    totalCartPrice:{
        type:Number,
        required:true,
        default:function (){
            return this.items.reduce(
                (total,item)=>total+item.totalCartPrice,0
            )
        }
    },
    totalDiscount: {
        type: Number,
        required: true,
        default: 0, 
      },
}
,
{
    timestamps:true,
})

module.exports = mongoose.model("Cart",cartSchema)

