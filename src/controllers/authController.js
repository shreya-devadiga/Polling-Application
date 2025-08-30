
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ email, passwordHash });
    return res.status(201).json({ message: "User registered", userId: user._id });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });


    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

    if (!JWT_SECRET)
      return res
        .status(500)
        .json({ message: "JWT secret missing. Check .env setup." });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const getProfile = async (req, res) => {
  return res.json({ id: req.user.id, email: req.user.email });
};
