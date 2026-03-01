import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Books', 'Magazines', 'Reports', 'Manuals', 'Others'],
      default: 'Others'
    },
    language: {
      type: String,
      enum: ["English", "Hindi", "Marathi"],
      required: [true, 'Language is required'],
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      min: [0, 'Size cannot be negative'],
      max: [10 * 1024 * 1024, 'File size cannot exceed 10MB'] // 10MB max
    },
    mimeType: {
      type: String,
      default: 'application/pdf'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    tags: [{
      type: String,
      trim: true
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 🔒 Indexes for better performance
pdfSchema.index({ category: 1, language: 1 });
pdfSchema.index({ createdAt: -1 });
pdfSchema.index({ title: 'text', description: 'text' });

// 🔒 Virtual for file size in KB
pdfSchema.virtual('sizeKB').get(function() {
  return (this.size / 1024).toFixed(2);
});

// 🔒 Increment view count
pdfSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  await this.save();
};

// 🔒 Increment download count
pdfSchema.methods.incrementDownloads = async function() {
  this.downloadCount += 1;
  await this.save();
};

export default mongoose.model("Pdf", pdfSchema);