const mongoose = require("mongoose");

const productSchema= new mongoose.Schema({
    name: {
        type:String,
        required:true
    },
    description:{
      type:String,
      required:true,
    },
    offer: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Offer",
    },
    price: {
        type:Number,
        required:true,
    },
    salePrice: {
        type: Number,
        required: true,
        min: 0,
        validate: {
          validator: function (value) {
            return value <= this.price;
          },
          message: "Sale price should not be greater than the regular price.",
        },
      },
      discountValue:{
        type:Number,
        min:0,
        default:undefined
       },
       discountedAmount:{
           type:Number,
           min:0,
           default:undefined
       },
       catOfferval:{
         type:Number,
         default:undefined,
       },
       productOffval:{
         type:Number,
         default:undefined
       },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
      sizes: [
        {
          size: { type: String, required: true },
          stock: { type: Number, required: true },
        },
      ],
      totalStock: {
        type: Number,
        required: true,
      },
      images: [
        {
          type: String,
          required: true,
        },
      ],
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    { timestamps: true }
  );

  productSchema.pre('save', async function(next) {
    try {
        if (!this.productOffval && !this.catOfferval) {
            this.discountValue = undefined;
            this.discountedAmount = undefined;
            this.salePrice = this.price;
            return next();
        }

        const productOffer = this.productOffval ? Number(this.productOffval) : 0;
        const categoryOffer = this.catOfferval ? Number(this.catOfferval) : 0;

        const highestDiscount = Math.max(productOffer, categoryOffer);

        if (highestDiscount <= 0) {
            this.discountValue = undefined;
            this.discountedAmount = undefined;
            this.salePrice = this.price;
            return next();
        }

        this.discountValue = highestDiscount;
        const discountAmount = (this.price * highestDiscount) / 100;
        this.discountedAmount = Math.round(discountAmount * 100) / 100; // Round to 2 decimal places

        this.salePrice = Math.max(0, this.price - this.discountedAmount);

        next();
    } catch (error) {
        next(error);
    }
});
 
  module.exports = mongoose.model("Product", productSchema);
  