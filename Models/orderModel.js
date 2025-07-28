const mongoose = require("mongoose")


const orderSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    orderId:{
        type:String,
    },
    orderItems:[
        {
            product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product",
                required:true,
            },
            size:{
                type:String,
                required:true,
            },
            qty:{
                type:Number,
                required:true,
                min:[1,"Quantity cannot be less than 1"]
            },
            price:{
                type:Number,
                required:true,
            },
            discount:{
                type:Number,
                required:true,
                default:0,
            },
            orderStatus:{
                type: String,
                required: true,
                enum: [
                  "Pending",
                  "Shipped",
                  "Delivered",
                  "Cancelled",
                  "Returned",
                  "Return Rejected",
                ],
                default: "Pending",
              },
              cancelReason:{
                type:String,
                default:null,
              },
              paymentStatus:{
                type: String,
                required: true,
                enum: ["Pending", "Paid", "Failed", "Refunded"],
                default: "Pending",
              },
              deliveredOn:{
                type:Date,
                default:Date.now
              },
              totalPrice: {
                type: Number,
                required: true,
              },
              returnReq:{
                requestStatus:{
                    type:String,
                    enum:["Pending","Accepted","Rejected"],
                },
                reason:{
                    type:String,
                },
                explanation:{
                    type:String,
                }
             }
        }
    ],
 totalAmount:{
    type:Number,
    required:true,
    min:[0,"Total amount cannot be negative"],
 },
 shippingAddress:{
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: Number, required: true },
    address: { type: String, required: true },
    landmark: { type: String },
    pincode: { type: Number, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
 },
 paymentMethod:{
    type:String,
    required:true,
    enum:["Cash on Delivery","RazorPay","wallet"],
 },
 totalDiscount: {
    type: Number,
    default: 0,
    min: [0, "Discount cannot be negative"],
    default: 0,
  },
  couponDiscount: {
    type: Number,
    default: 0,
  },
  shippingFee: {
    type: Number,
    required: true,
    min: [0, "Shipping fee cannot be negative"],
  },
  total_price_with_discount: {
    type: Number,
    // required: true,
  },
  placedAt: {
    type: Date,
    default: Date.now,
  },
  deliveryBy: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isReturnReq: {
    type: Boolean,
    default: false,
  },

})

// orderSchema.pre("save", function (next) {
//   // Loop through each order item
//   this.orderItems.forEach(item => {
//     if (!item.deliveredOn) {
//       const deliveryDate = new Date();
//       deliveryDate.setDate(deliveryDate.getDate());
//       deliveryDate.setHours(15, 0, 0, 0);
//       item.deliveredOn = deliveryDate;
//     }
//   });
//   next();
// });


  orderSchema.pre("save", function (next) {
    if (!this.orderId) {
      const uniqueId = `CG${Date.now()}${Math.floor(Math.random() * 1000)}`;
      this.orderId = uniqueId;
    }
    next();
  });
  orderSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
  });
  
module.exports = mongoose.model("Order",orderSchema);