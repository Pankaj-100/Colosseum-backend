const { User } = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");
const nodemailer = require("../utils/nodeMailer");


const jwt = require("jsonwebtoken");

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Signup
const signup = catchAsyncErrors(async (req, res, next) => {
  const { name, email, countryCode, contact, password, preferredLanguage  } = req.body;

  if (!name || !email || !countryCode || !contact || !password) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  const existingUser = await User.findOne({ 
    $or: [
      { email },
      { contact }
    ] 
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return next(new ErrorHandler("Email already registered", 400));
    }
    return next(new ErrorHandler("Phone number already registered", 400));
  }

  const hashedPassword = await bcryptjs.hash(password, 10);
  
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    name,
    email,
    countryCode,
    contact,
    password: hashedPassword,
    preferredLanguage,
    verified: false,
    otp,
    otpExpires
  });


  const result = await nodemailer.verifyEmail(email, name, otp);
  if (!result.success) {
    return next(new ErrorHandler("Failed to send verification OTP", 500));
  }

  res.status(201).json({
    success: true,
    message: "OTP sent to your email for verification",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      countryCode: user.countryCode,
      contact: user.contact,
      preferredLanguage: user.preferredLanguage
    }
  });
});

// Verify Email OTP
const verifyOTP = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorHandler("Email and OTP are required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (user.verified) {
    return next(new ErrorHandler("Email already verified", 400));
  }

  if (user.otp !== otp) {
    return next(new ErrorHandler("Invalid OTP", 400));
  }

  if (new Date() > user.otpExpires) {
    return next(new ErrorHandler("OTP has expired", 400));
  }

  user.verified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
   
  });
});

// Signin
const signin = catchAsyncErrors(async (req, res, next) => {
  const { countryCode, contact, password } = req.body;

  if (!countryCode || !contact || !password) {
    return next(new ErrorHandler("Country code, contact and password are required", 400));
  }

  const user = await User.findOne({ countryCode, contact }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  if (!user.verified) {
    return next(new ErrorHandler("Please verify your email first", 401));
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE ,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
     
      name: user.name,
      email: user.email,
      countryCode: user.countryCode,
      contact: user.contact,
      preferredLanguage: user.preferredLanguage
    }
  });
});

// Resend OTP
const resendOTP = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (user.verified) {
    return next(new ErrorHandler("Email already verified", 400));
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  const result = await nodemailer.verifyEmail(email, user.name, otp);
  if (!result.success) {
    return next(new ErrorHandler("Failed to resend OTP", 500));
  }

  res.status(200).json({
    success: true,
    message: "New OTP sent to your email"
  });
});

module.exports = {
  signup,
  verifyOTP,
  signin,
  resendOTP
};