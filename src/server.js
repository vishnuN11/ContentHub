import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminArticleRoutes from "./routes/adminArticleRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import finance from "./routes/financeRoutes.js";
dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

app.use(cors(corsOptions));

// ✅ Apply CORS to all routes
app.use(cors(corsOptions));


app.use(helmet());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/articles", adminArticleRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/finance", finance);

app.listen(process.env.PORT, () => console.log("Server running on 5000"));
