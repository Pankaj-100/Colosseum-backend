const { User } = require("../models/userModel");
const { Video } = require("../models/videoModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');
const { getFileUrl } = require("../utils/helperFuns");

const addUrl = (req, filePath) => {
  if (!filePath) return null;
  return `${process.env.URL}${filePath}`;
};

// User profile
const profile = catchAsyncErrors(async (req, res, next) => {
  const userid = req.userId;
  const user = await User.findById(userid).select("-password -otp -otpExpires -role -verified");
  
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Add full URL to profile image if it exists
  const userWithUrl = {
    ...user.toObject(),
    profileImage: user.profileImage ? addUrl(req, user.profileImage) : "hello"
  };

  res.status(200).json({
    success: true,
    user: userWithUrl
  });
});

// Upload/Update Profile Image
const uploadProfileImages = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorHandler('Please upload an image', 400));
  }

  const id = req.userId;
  const user = await User.findById(id);
  
  // Delete old profile image if it exists
  if (user.profileImage && user.profileImage.includes('/public/')) {
    const relativePath = user.profileImage.split('/public/')[1]; 
    const parts = relativePath.split('/');

    if (parts.length >= 2) {
      const folderPath = path.join('public', parts[0], parts[1]); 
      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
      }
    }
  }

  user.profileImage = getFileUrl(req, req.files.image[0].path);
  await user.save();

  res.status(200).json({
    success: true,
    imageUrl: addUrl(req, user.profileImage)
  });
});

// Update profile
const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const userId = req.userId;
  const updates = req.body;
console.log(req.files.image)
  // Handle profile image update if provided
  if (req.files.image[0]) {
    const user = await User.findById(userId);
    
    // Delete old profile image if it exists
    if (user.profileImage && user.profileImage.includes('/public/')) {
      const relativePath = user.profileImage.split('/public/')[1]; 
      const parts = relativePath.split('/');

      if (parts.length >= 2) {
        const folderPath = path.join('public', parts[0], parts[1]); 
        if (fs.existsSync(folderPath)) {
          fs.rmSync(folderPath, { recursive: true, force: true });
        }
      }
    }
    
    updates.profileImage = getFileUrl(req, req.files.image[0].path);
  }

  const restrictedFields = ['password', 'role', 'verified', 'otp', 'otpExpires'];
  restrictedFields.forEach(field => delete updates[field]);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true, runValidators: true }
  ).select('-password -otp -otpExpires -role -verified -_id');

  // Add full URL to profile image if it exists
  const userWithUrl = {
    ...updatedUser.toObject(),
    profileImage: updatedUser.profileImage ? addUrl(req, updatedUser.profileImage) : null
  };

  res.status(200).json({
    success: true,
    user: userWithUrl
  });
});

// Get videos for user
const getVideos = catchAsyncErrors(async (req, res, next) => {
  const userId = req.userId;
  const user = await User.findById(userId).select('preferredLanguage');
  
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  const videos = await Video.aggregate([
    { $match: { language: user.preferredLanguage } },
    { $addFields: {
        thumbnailUrl: { $concat: [process.env.URL, "$thumbnailUrl"] },
        videoUrl: { $concat: [process.env.URL,  "$videoUrl"] }
      }
    },
    { $sort: { createdAt: -1 } }
  ]);

  res.status(200).json({  
    success: true,
    data: { videos },
    message: `Videos in ${user.preferredLanguage} fetched successfully`
  });
});

// Delete account
const deleteaccount = catchAsyncErrors(async (req, res, next) => {
  const id = req.userId;
  const user = await User.findById(id);
  
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Delete profile image if it exists
  if (user.profileImage && user.profileImage.includes('/public/')) {
    const relativePath = user.profileImage.split('/public/')[1]; 
    const parts = relativePath.split('/');

    if (parts.length >= 2) {
      const folderPath = path.join('public', parts[0], parts[1]); 
      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
      }
    }
  }

  await User.findByIdAndDelete(id);
  res.status(200).json({
    success: true,
    message: "Account deleted successfully"
  });
});

module.exports = {
  profile,
  uploadProfileImages,
  getVideos,
  updateProfile,
  deleteaccount
};