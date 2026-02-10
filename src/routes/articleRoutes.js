import express from "express";
import { createArticle, getArticles } from "../controllers/articleController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, adminOnly, createArticle);
router.get("/", getArticles);

export default router;
