const { User } = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");
const nodemailer = require("../utils/nodeMailer");
const { isValidPhoneNumber } = require("libphonenumber-js");
const createNotification = require("../utils/createNotification");

const jwt = require("jsonwebtoken");

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Signup
const signup = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, preferredLanguage } = req.body;

  if (!name || !email || !phone || !password) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  // if (!isValidPhoneNumber(phone)) {
  //   return res.status(400).json({ message: "Invalid phone number format" });
  // }

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

  if (existingUser) {
    if (existingUser.verified) {
      return next(new ErrorHandler("Email or phone number already registered", 400));
    }

    // If user exists but is not verified, restart the OTP process
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    existingUser.name = name;
    existingUser.password = await bcryptjs.hash(password, 10);
    existingUser.preferredLanguage = preferredLanguage || "Spanish";
    existingUser.otp = otp;
    existingUser.otpExpires = otpExpires;

    await existingUser.save();

    const result = await nodemailer.verifyEmail(email, name, otp);
    if (!result.success) {
      return next(new ErrorHandler("Failed to send verification OTP", 500));
    }
    return res.status(200).json({
      success: true,
      message: "New OTP sent to your email for verification",
      user: {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        phone: existingUser.phone,
        preferredLanguage: existingUser.preferredLanguage,
        otp,
      },
    });
  }

  const hashedPassword = await bcryptjs.hash(password, 10);

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  const newuser = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    preferredLanguage,
    verified: false,
    otp,
    otpExpires,
  });

  const result = await nodemailer.verifyEmail(email, name, otp);
  if (!result.success) {
    return next(new ErrorHandler("Failed to send verification OTP", 500));
  }

  res.status(201).json({
    success: true,
    message: "OTP sent to your email for verification",
    user: {
      _id: newuser._id,
      name: newuser.name,
      email: newuser.email,
      phone: newuser.phone,
      preferredLanguage: newuser.preferredLanguage,
      otp,
    },
  });
});
// Verify Email OTP
const verifyOTP = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new ErrorHandler("Email and OTP are required", 400));
  }

  const user = await User.findOne({ email }).select("+password"); 

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
  // 🔔 Create welcome notification
await createNotification({
  userId: user._id,
  title: "Welcome to Colosseum Video App AI",
  description: `Hi ${user.name}, thank you for joining us! Your account has been successfully verified.`,
});

  // Generate JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  // Send token and user info
  res.status(200).json({
    success: true,
    message: "Email verified successfully",
    token,
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage
    }
  });
});

// Signin
const signin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if ( !email || !password) {
    return next(new ErrorHandler("email and password are required", 400));
  }
  const user = await User.findOne({ email }).select("+password");

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
  expiresIn: process.env.JWT_EXPIRE,
});

// Save token to DB
user.currentToken = token;
await user.save();

res.status(200).json({
  success: true,
  message: "Login successful",
  token,
  user: {
    name: user.name,
    email: user.email,
    phone: user.phone,
    preferredLanguage: user.preferredLanguage,
  },
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
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

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
  const otp = generateOTP();
  user.resetPasswordOTP = otp;
  user.resetPasswordExpires = Date.now() + 10*60*1000; 
  await user.save();

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
// Change Password
const changePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId =  req.userId ; 

  if (!currentPassword || !newPassword) {
    return next(new ErrorHandler("Both current and new passwords are required", 400));
  }

  const user = await User.findById(userId).select("+password");
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const isMatch = await bcryptjs.compare(currentPassword, user.password);
  if (!isMatch) {
    return next(new ErrorHandler("Current password is incorrect", 401));
  }

  user.password = await bcryptjs.hash(newPassword, 10);
  await user.save();
  await createNotification({
  userId: user._id,
  title: "Password Changed",
  description: "Your account password has been successfully changed.",
});

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});


module.exports = {
  signup,
  verifyOTP,
  signin,
  resendOTP,
  forgotPasswordRequestOTP,
  forgotPasswordVerifyOTP,
  forgotPasswordReset,
  changePassword
};