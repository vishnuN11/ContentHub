import mongoose from "mongoose";

const financeSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, default: "" },
      mr: { type: String, default: "" },
      hi: { type: String, default: "" },
    },
    description: {
      en: { type: String, default: "" },
      mr: { type: String, default: "" },
      hi: { type: String, default: "" },
    },
    lang: {
      type: String,
      enum: ["en", "mr", "hi"],
      required: true,
    },
    category: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Finance", financeSchema);
