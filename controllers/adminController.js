const { User } = require("../models/userModel");
const { Video } = require("../models/videoModel");
const bcryptjs = require("bcryptjs");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");
const jwt = require("jsonwebtoken");

// Admin Login
const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Email and password are required", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  if (user.role !== "admin") {
    return next(new ErrorHandler("Not authorized as admin", 403));
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });

  res.status(200).json({
    success: true,
    message: "Admin login successful",
    token,
   
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone:user.phone,
      role: user.role
    }
  });
});

// Get Dashboard 
const getDashboardData = catchAsyncErrors(async (req, res, next) => {
  const excludeAdmin = { role: { $ne: "admin" } };
  const totalUsers = await User.countDocuments(excludeAdmin);
  const totalVideos = await Video.countDocuments();
  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalVideos,
    },
  });
});

// Get All Users with Pagination
const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const excludeAdmin = { role: { $ne: "admin" } };
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find(excludeAdmin)
    .select("-password -otp -otpExpires")
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments(excludeAdmin);

  res.status(200).json({
    success: true,
    count: users.length,
    total: totalUsers,
    page,
    pages: Math.ceil(totalUsers / limit),
    users
  });
});

// Get Single User
const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password ");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user
  });
});
// Update User Details
const updateUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone, verified } = req.body;

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  // Email check (excludes current user)
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ 
      email, 
      _id: { $ne: id } 
    });
    if (emailExists) return next(new ErrorHandler("Email already in use", 400));
  }

  // Contact check (excludes current user)
  if (phone && phone !== user.phone) {
    const contactExists = await User.findOne({ 
      phone, 
      _id: { $ne: id } 
    });
    if (contactExists) {
      return next(new ErrorHandler(
        `Contact number already used by: ${contactExists.email}`,
        400
      ));
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { 
      name: name || user.name,
      email: email || user.email,
      phone: phone || user.phone,
      verified: verified ?? user.verified // Nullish coalescing
    },
    { 
      new: true, 
      runValidators: true 
    }
  ).select("-password -otp -otpExpires");

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    user: updatedUser
  });
});
// Delete User
const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (user.role === "admin") {
    return next(new ErrorHandler("Cannot delete admin user", 403));
  }

  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});


module.exports = {
  login,
  getDashboardData,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser
};
