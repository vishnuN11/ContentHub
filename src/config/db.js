import mongoose from "mongoose";

const connectDB = async () => {
  await mongoose.connect(process.env.DBURL);
  console.log("MongoDB Connected");
};

export default connectDB;
