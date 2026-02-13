import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { createHealth, getHealth ,toggleLike} from "../controllers/financeController.js";

const router = express.Router();

router.post("/",protect, adminOnly, createHealth);
router.get("/",protect, getHealth);
router.put("/:id/like",protect, toggleLike);

export default router;
