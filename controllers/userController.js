const { User } = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");
const jwt = require("jsonwebtoken");

// user profile
const profile = catchAsyncErrors(async (req, res, next) => {

const userid=req.body;
    const user = await User.findById(userid).select("-password ");
  
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
  
    res.status(200).json({
      success: true,
      user
    });
  });


module.exports = {
  profile
};
