const { User } = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");
const nodemailer = require("../utils/nodeMailer");
const { isValidPhoneNumber } = require("libphonenumber-js");


const jwt = require("jsonwebtoken");

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Signup
const signup = catchAsyncErrors(async (req, res, next) => {
  const { name, email,phone,password, preferredLanguage  } = req.body;

  if (!name || !email || !phone || !password) {
    return next(new ErrorHandler("All fields are required", 400));
  }
  if (!isValidPhoneNumber(phone)) {
    return res.status(400).json({ message: "Invalid phone number format" });
  }
  

  const existingUser = await User.findOne({ 
    $or: [
      { email },
      { phone }
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
    phone,
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
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      otp,
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
  const { phone, password } = req.body;

  if ( !phone || !password) {
    return next(new ErrorHandler("phone number and password are required", 400));
  }

  const user = await User.findOne({ phone }).select("+password");

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
      phone: user.phone,
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
    message: "New OTP sent to your email",
    otp
  });
});

// Request OTP for password reset
const forgotPasswordRequestOTP = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new ErrorHandler("Email is required", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new ErrorHandler("User not found", 404));

  // Generate and save OTP
  const otp = generateOTP();
  user.resetPasswordOTP = otp;
  user.resetPasswordExpires = Date.now() + 10*60*1000; // 10 minutes
  await user.save();

  // Send OTP via email
  const result = await nodemailer.forgotpassword(email, user.name, otp);
  if (!result.success) return next(new ErrorHandler("Failed to send OTP", 500));

  res.status(200).json({
    success: true,
    message: "OTP sent to your email",
    email,
    otp
  });
});

//  Verify OTP
const forgotPasswordVerifyOTP = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) return next(new ErrorHandler("Email and OTP required", 400));

  const user = await User.findOne({ 
    email,
    resetPasswordOTP: otp,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) return next(new ErrorHandler("Invalid OTP or expired", 400));

  user.resetPasswordOTP = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    email
  });
});

//  Reset Password
const forgotPasswordReset = catchAsyncErrors(async (req, res, next) => {
  const { email, newPassword } = req.body;

  if (!email ||  !newPassword)
    return next(new ErrorHandler("All fields required", 400));

  const user = await User.findOne({
    email
  });



  // Update password 
  user.password = await bcryptjs.hash(newPassword, 10);

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully"
  });
});

module.exports = {
  signup,
  verifyOTP,
  signin,
  resendOTP,
  forgotPasswordRequestOTP,
  forgotPasswordVerifyOTP,
  forgotPasswordReset
};