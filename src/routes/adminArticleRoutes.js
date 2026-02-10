import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import {
  addComment,
  createArticle,
  deleteArticle,
  deleteComment,
  getArticles,
  getComments,
  getDemoArticles,
  toggleLike,
} from "../controllers/articleController.js";

const router = express.Router();

// PUBLIC
router.get("/",protect, getArticles);
router.get("/demo", getDemoArticles);

// ADMIN ONLY
router.post("/", protect, adminOnly, createArticle);
// router.put("/:id", protect, adminOnly, updateArticle);
router.delete("/:id", protect, adminOnly, deleteArticle);
router.put("/:id/like", protect, toggleLike);
router.post("/:id/comment", protect, addComment);
router.get("/:id/comments", getComments);
router.delete(
  "/:articleId/comment/:commentId",
  protect,
  deleteComment
);
export default router;
