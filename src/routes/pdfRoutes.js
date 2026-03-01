import express from "express";
import multer from "multer";
import {
  uploadPdf,
  getPdfs,
  getPdfDetails,
  viewPdf,
  downloadPdf,
  deletePdf,
  getFilters
} from "../controllers/pdfController.js";
import {protect} from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer configuration for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Public routes
router.get("/", getPdfs);
router.get("/filters", getFilters);
router.get("/view/:id", viewPdf);
router.get("/details/:id", getPdfDetails);

// Protected routes (require authentication)
router.get("/download/:id", protect, downloadPdf);

// Admin only routes
router.post("/upload", protect, upload.single("file"), uploadPdf);
router.delete("/:id", protect, deletePdf);

export default router;