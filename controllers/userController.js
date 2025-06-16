const { User } = require("../models/userModel");
const { Video } = require("../models/videoModel");
const bcryptjs = require("bcryptjs");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");
const jwt = require("jsonwebtoken");
const { uploadProfileImage } = require('../utils/s3');
const {
  awsUrl,
} = require("../utils/helperFuns");

// user profile
const profile = catchAsyncErrors(async (req, res, next) => {
const userid= req.userId;
    const user = await User.findById(userid).select("-password -otp -otpExpires -role -verified ");
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
  
    res.status(200).json({
      success: true,
      user
    });
  });

// Upload/Update Profile Image
const uploadProfileImages = catchAsyncErrors(async (req, res, next) => {
    if (!req.file) {
      return next(new ErrorHandler('Please upload an image', 400));
    }
   const id=    req.userId;
console.log(req.file)
    const { imageUrl } = await uploadProfileImage(req.file, id);
    const user = await User.findById(id);
   user.profileImage = imageUrl;

    await user.save();
  
    res.status(200).json({
      success: true,
      imageUrl
    });
  });
  
const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const userId = req.userId;
    const updates = req.body;
  
    if (req.file) {
      try {
        const { imageUrl } = await uploadProfileImage(req.file, userId);
        updates.profileImage = imageUrl;
      } catch (error) {
        return next(new ErrorHandler('Failed to upload profile image', 500));
      }
    }
    const restrictedFields = ['password', 'role', 'verified', 'otp', 'otpExpires'];
    restrictedFields.forEach(field => delete updates[field]);
  
    // // Validate phone format if being updated
    // if (updates.phone) {
    //   const phoneRegex = /^\+[1-9]\d{1,14}$/;
    //   if (!phoneRegex.test(updates.phone)) {
    //     return next(new ErrorHandler("Phone number must be in E.164 format", 400));
    //   }
    // }
  
    // // If email is changed, mark as unverified
    // if (updates.email) {
    //   const user = await User.findById(userId);
    //   if (user.email !== updates.email) {
    //     updates.verified = false;
    //     // Here you would typically send verification email
    //   }
    // }
  
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpires -role -verified -_id');
  
    res.status(200).json({
      success: true,
      user: updatedUser
    });
  });

  const getVideos = catchAsyncErrors(async (req, res, next) => {
    const userId = req.userId;
    const user = await User.findById(userId).select('preferredLanguage');
    
    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }
    const videosQuery = Video.aggregate([
  
      {
        $match: {
          language: user.preferredLanguage
        }
      },
   
      {
        $addFields: {
          thumbnailUrl: {
            $concat: [awsUrl, "/", "$thumbnailUrl"],
          },
          videoUrl: {
            $concat: [awsUrl, "/", "$videoUrl"],
          },
        },
      },
    
      {
        $sort: { createdAt: -1 }
      }
    ]);
  
    const videos = await videosQuery;
    res.status(200).json({  
      success: true,
      data: { videos },
      message: `Videos in ${user.preferredLanguage} fetched successfully`,
    });
  });

  const deleteaccount = catchAsyncErrors(async (req, res, next) => {
    const  id  = req.userId;
  
    const user = await User.findById(id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
 
      console.log(id)
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
