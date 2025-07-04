import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "matka-hub-secret-key-2024";

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
};

const checkDatabaseConnection = (): boolean => {
  return mongoose.connection.readyState === 1;
};

const handleDatabaseError = (res: any) => {
  res.status(503).json({
    message:
      "Database unavailable. Please add your IP to MongoDB Atlas whitelist and restart the server.",
  });
};

export const registerUser: RequestHandler = async (req, res) => {
  if (!checkDatabaseConnection()) {
    handleDatabaseError(res);
    return;
  }

  try {
    const { fullName, email, mobile, password, referralCode } = req.body;

    if (!fullName || !email || !mobile || !password) {
      res.status(400).json({ message: "All required fields must be provided" });
      return;
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Mobile number already registered",
      });
      return;
    }

    const user = new User({
      fullName,
      email,
      mobile,
      password,
      referralCode: referralCode || undefined,
    });

    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      res.status(400).json({ message: messages.join(", ") });
    } else {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  }
};

export const loginUser: RequestHandler = async (req, res) => {
  if (!checkDatabaseConnection()) {
    handleDatabaseError(res);
    return;
  }

  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      res
        .status(400)
        .json({ message: "Mobile number and password are required" });
      return;
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      res.status(401).json({ message: "Invalid mobile number or password" });
      return;
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid mobile number or password" });
      return;
    }

    if (!user.isActive) {
      res
        .status(401)
        .json({ message: "Account is deactivated. Please contact support." });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const forgotPassword: RequestHandler = async (req, res) => {
  if (!checkDatabaseConnection()) {
    handleDatabaseError(res);
    return;
  }

  try {
    const { mobile } = req.body;

    if (!mobile) {
      res.status(400).json({ message: "Mobile number is required" });
      return;
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      res
        .status(404)
        .json({ message: "No account found with this mobile number" });
      return;
    }

    res.json({
      message: "Password reset instructions sent successfully",
      mobile: mobile.replace(/(\d{6})(\d{4})/, "******$2"),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

export const adminLogin: RequestHandler = async (req, res) => {
  if (!checkDatabaseConnection()) {
    handleDatabaseError(res);
    return;
  }

  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      res
        .status(400)
        .json({ message: "Mobile number and password are required" });
      return;
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      res.status(401).json({ message: "Invalid mobile number or password" });
      return;
    }

    // Check if user has admin privileges
    if (user.role !== "admin" && user.role !== "superadmin") {
      res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
      return;
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid mobile number or password" });
      return;
    }

    if (!user.isActive) {
      res
        .status(401)
        .json({ message: "Account is deactivated. Please contact support." });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error during admin login" });
  }
};

export const getProfile: RequestHandler = async (req, res) => {
  if (!checkDatabaseConnection()) {
    handleDatabaseError(res);
    return;
  }

  try {
    const user = (req as any).user;
    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
