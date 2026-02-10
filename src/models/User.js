import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:{type:String,required:true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: {
      type: Boolean,
      default: false, // VERY IMPORTANT
    },
    // 🔒 Subscription (FOR FUTURE USE)
  // isSubscribed: {
  //   type: Boolean,
  //   default: false,
  // },

  // subscription: {
  //   plan: String,
  //   startDate: Date,
  //   endDate: Date,
  //   paymentId: String,
  // },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
