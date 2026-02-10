import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      // trim: true
    }
  },
  { timestamps: true }
);

const ArticleSchema = new mongoose.Schema(
  {
    title: {
      mr: String,
      en: String,
      hi: String
    },
    description: {
      mr: String,
      en: String,
      hi: String
    },
    author: String,
    date: Date,
    isPremium: { type: Boolean, default: false },

    // ❤️ LIKE SYSTEM
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 💬 COMMENTS SYSTEM
    comments: [CommentSchema]
  },
  { timestamps: true }
);

export default mongoose.model("Article", ArticleSchema);
