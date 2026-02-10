import mongoose from "mongoose";

const stockCacheSchema = new mongoose.Schema({
  symbol: String,
  range: String,
  data: Object,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // auto delete after 5 min
  }
});

export default mongoose.model("StockCache", stockCacheSchema);
