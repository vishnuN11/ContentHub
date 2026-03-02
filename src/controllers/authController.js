import User from "../models/User.js";
import Otp from "../models/Otp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 📝 Register with OTP verification
export const register = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    // Validation
    if (!name || !email || !password || !otp) {
      return res.status(400).json({ 
        success: false,
        message: "All fields including OTP are required" 
      });
    }

    // Check if user exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // ✅ Verify OTP
    const otpRecord = await Otp.findOne({
      email,
      otp,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired OTP" 
      });
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Hash password
    const hash = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await User.create({ 
      name, 
      email, 
      password: hash 
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin || false,
        email: user.email,
        name: user.name
      },
      process.env.SECRETEkEY, // ✅ FIXED: Use JWT_SECRET instead of SECRETEkEY
      { expiresIn: "7d" }
    );

    res.status(201).json({ 
      success: true,
      message: "Registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error during registration" 
    });
  }
};

// 🔑 Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // ✅ FIXED: Use JWT_SECRET
    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin || false,
        email: user.email,
        name: user.name
      },
      process.env.SECRETEkEY,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
};