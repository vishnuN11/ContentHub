import express from "express";
import {
  createPost,
  getPosts,
  toggleLike,
} from "../controllers/healthController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/",protect, createPost);
router.get("/",protect, getPosts);
router.put("/:id/like",protect, toggleLike);

export default router;
