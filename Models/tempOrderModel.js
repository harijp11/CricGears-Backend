const mongoose = require("mongoose");

const tempOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cartItems: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      size: {
        type: String,
        required: true,
      },
      qty: {
        type: Number,
        required: true,
        min: [1, "Quantity cannot be less than 1"],
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 200, 
  },
});
