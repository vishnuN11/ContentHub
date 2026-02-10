import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const {name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "User exists" });

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({name, email, password: hash });

  res.status(201).json({ message: "Registered successfully" });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
  {
    id: user._id,
    isAdmin: user.isAdmin,   // ✅ REQUIRED
    email: user.email,
    name: user.name
  },
  "super_secret_key_123",
  { expiresIn: "7d" }
);

 
  res.json({
    token,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    userId:user._id
  });
};
