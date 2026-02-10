import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminArticleRoutes from "./routes/adminArticleRoutes.js";
dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/articles", adminArticleRoutes);


app.listen(process.env.PORT, () => console.log("Server running on 5000"));
