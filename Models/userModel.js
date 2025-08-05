const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure email is unique
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
        default:null,
    },
    password: {
        type: String,
        trim:true,
        required: function() {
            return !this.googleId; // Only required if not a Google OAuth user
          }
    },
    referralCode: { // Corrected "referalCode" typo
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    usedReferral: {
        type: Boolean,
        default: false,
      },
    googleId: {
        type: String,
        trim: true,
    },
   
},
 {timestamps:true}
);

// Export the model
module.exports = mongoose.model("User", UserSchema);
