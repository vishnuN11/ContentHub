import express from 'express';
import Otp from '../models/Otp.js';
import User from '../models/User.js';
// import { generateOTP, sendOTPEmail } from '../services/emailService.js';
import { generateOTP, sendOTPEmail } from '../services/sendgridService.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for OTP (per email)
const otpLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Max 5 OTP requests per day per email
  keyGenerator: (req) => req.body.email,
  message: 'Too many OTP requests. Please try again tomorrow.',
});

// Send OTP
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email, verified: false });

    // Generate new OTP
    const otp = generateOTP();

    // Save OTP to database
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'OTP sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    // Find valid OTP
    const otpRecord = await Otp.findOne({
      email,
      otp,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.json({
      success: true,
      message: 'OTP verified successfully',
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});
// Resend OTP
router.post('/resend-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email, verified: false });

    // Generate new OTP
    const otp = generateOTP();

    // Save new OTP to database
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'OTP resent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP',
      });
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});
export default router;