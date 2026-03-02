import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminArticleRoutes from "./routes/adminArticleRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import mockPaymentRoutes from "./routes/mockPaymentRoutes.js";

dotenv.config();
connectDB();

const app = express();

/* =====================================================
   ✅ 1. CORS - Production Ready
===================================================== */
const allowedOrigins = [
  "http://localhost:5173", 
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.log('Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

/* =====================================================
   ✅ 2. Body Parser with limit
===================================================== */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* =====================================================
   ✅ 3. Routes
===================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/articles", adminArticleRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/mock-payment", mockPaymentRoutes);
app.use("/api/subscription", mockPaymentRoutes);

/* =====================================================
   ✅ 4. 404 Handler
===================================================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =====================================================
   ✅ 5. Global Error Handler
===================================================== */
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
  
  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});