import mongoose from "mongoose";
import Pdf from "../models/Pdf.js";
import User from "../models/User.js";

let gfs;

mongoose.connection.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "pdfs",
  });
});

// 🔒 Helper function to check subscription
const checkSubscription = async (userId) => {
  const user = await User.findById(userId);
  return user && (user.isAdmin || user.hasActiveSubscription());
};

// 🔒 Upload PDF (Admin only)
export const uploadPdf = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Only admins can upload PDFs" 
      });
    }

    // Validate file
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Please upload a file" 
      });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ 
        success: false, 
        message: "Only PDF files are allowed" 
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        success: false, 
        message: "File size cannot exceed 10MB" 
      });
    }

    const { title, category, language, description, tags } = req.body;

    // Validate required fields
    if (!title || !category || !language) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, category, and language are required" 
      });
    }

    // Upload to GridFS
    const uploadStream = gfs.openUploadStream(req.file.originalname, {
      contentType: "application/pdf",
      metadata: {
        uploadedBy: req.user.id,
        title,
        category
      }
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", async () => {
      // Create PDF record
      const pdf = await Pdf.create({
        title,
        description: description || '',
        category,
        language,
        fileId: uploadStream.id,
        filename: req.file.originalname,
        size: req.file.size,
        uploadedBy: req.user.id,
        tags: tags ? tags.split(',').map(t => t.trim()) : []
      });

      res.status(201).json({
        success: true,
        message: "PDF uploaded successfully",
        pdf
      });
    });

    uploadStream.on("error", (error) => {
      throw error;
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Error uploading PDF",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// 🔒 Get PDFs with filtering and pagination
export const getPdfs = async (req, res) => {
  try {
    const { category, language, search, page = 1, limit = 12 } = req.query;

    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (language) filter.language = language;
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Pdf.countDocuments(filter);

    // Get PDFs
    const pdfs = await Pdf.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('uploadedBy', 'name email');

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      pdfs
    });

  } catch (err) {
    console.error('Get PDFs error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching PDFs" 
    });
  }
};

// 🔒 Get PDF details
export const getPdfDetails = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id)
      .select('-__v')
      .populate('uploadedBy', 'name email');

    if (!pdf) {
      return res.status(404).json({ 
        success: false, 
        message: "PDF not found" 
      });
    }

    // Increment view count
    await pdf.incrementViews();

    res.json({
      success: true,
      pdf
    });

  } catch (err) {
    console.error('Get PDF details error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching PDF details" 
    });
  }
};

// 🔒 View PDF (stream - no subscription needed)
// export const viewPdf = async (req, res) => {
//   try {
//     const pdf = await Pdf.findById(req.params.id);

//     if (!pdf || !pdf.isActive) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "PDF not found" 
//       });
//     }

//     // Check if file exists in GridFS
//     const files = await gfs.find({ _id: pdf.fileId }).toArray();
//     if (!files || files.length === 0) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "PDF file not found" 
//       });
//     }

//     // Set headers for viewing
//     res.set({
//       'Content-Type': 'application/pdf',
//       'Content-Disposition': `inline; filename="${encodeURIComponent(pdf.filename)}"`,
//       'Cache-Control': 'public, max-age=3600'
//     });

//     const downloadStream = gfs.openDownloadStream(pdf.fileId);
//     downloadStream.pipe(res);

//   } catch (err) {
//     console.error('View PDF error:', err);
//     res.status(500).json({ 
//       success: false, 
//       message: "Error viewing PDF" 
//     });
//   }
// };

export const viewPdf = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="' + pdf.filename + '"'
    });

    const downloadStream = gfs.openDownloadStream(pdf.fileId);
    downloadStream.pipe(res);

  } catch (err) {
    res.status(500).json({ message: "PDF not found" });
  }
};

// 🔒 Download PDF (subscription required)
export const downloadPdf = async (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Please login to download" 
      });
    }

    const pdf = await Pdf.findById(req.params.id);

    if (!pdf || !pdf.isActive) {
      return res.status(404).json({ 
        success: false, 
        message: "PDF not found" 
      });
    }

    // Check subscription (admin bypass)
    const hasAccess = req.user.isAdmin || await checkSubscription(req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: "Please subscribe to download PDFs",
        requiresSubscription: true
      });
    }

    // Check if file exists
    const files = await gfs.find({ _id: pdf.fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "PDF file not found" 
      });
    }

    // Set headers for download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(pdf.filename)}"`,
      'Content-Length': pdf.size,
      'Cache-Control': 'no-cache'
    });

    // Increment download count
    await pdf.incrementDownloads();

    const downloadStream = gfs.openDownloadStream(pdf.fileId);
    downloadStream.pipe(res);

  } catch (err) {
    console.error('Download PDF error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Error downloading PDF" 
    });
  }
};

// 🔒 Delete PDF (Admin only)
export const deletePdf = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Only admins can delete PDFs" 
      });
    }

    const pdf = await Pdf.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ 
        success: false, 
        message: "PDF not found" 
      });
    }

    // Soft delete (mark as inactive)
    pdf.isActive = false;
    await pdf.save();

    // Actually delete from GridFS (optional - uncomment if you want permanent delete)
    // await gfs.delete(pdf.fileId);

    res.json({
      success: true,
      message: "PDF deleted successfully"
    });

  } catch (err) {
    console.error('Delete PDF error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting PDF" 
    });
  }
};

// 🔒 Get categories and languages for filters
export const getFilters = async (req, res) => {
  try {
    const categories = await Pdf.distinct('category', { isActive: true });
    const languages = await Pdf.distinct('language', { isActive: true });

    res.json({
      success: true,
      categories: categories.filter(Boolean),
      languages: languages.filter(Boolean)
    });

  } catch (err) {
    console.error('Get filters error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching filters" 
    });
  }
};