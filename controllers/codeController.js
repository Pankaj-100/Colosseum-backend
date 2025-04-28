const  {ActivationCode}  = require("../models/activationCodeModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");


// Generate random 4-digit activation code
const generateActivationCode = () => Math.floor(1000 + Math.random() * 9000).toString();

// Generate codes in bulk (Admin only)
exports.generateCodes = catchAsyncErrors(async (req, res, next) => {
  const { count = 20 } = req.body;
  
  if (!count || count <= 0) {
    return next(new ErrorHandler("Invalid count value", 400));
  }

  const codes = [];
  const rawCodes = [];
  
  // Generate codes
  for (let i = 0; i < count; i++) {
    const rawCode = generateActivationCode();
    rawCodes.push(rawCode);
    codes.push({
      code: rawCode, 
      generatedBy: req.user._id
    });
  }


  await ActivationCode.insertMany(codes);

 
  res.status(201).json({
    success: true,
    count: codes.length,
    codes: rawCodes,
    message: "Activation codes generated successfully"
  });
});

// Validate activation code (User)
exports.validateCode = catchAsyncErrors(async (req, res, next) => {
  const { code, deviceId } = req.body;

  if (!code || !deviceId) {
    return next(new ErrorHandler("Code and device ID are required", 400));
  }

// 1. Find the code directly in database (no need to fetch all codes)
const matchedCode = await ActivationCode.findOne({ 
    code: code,        // Direct string comparison
      // Only unused codes
  });



  if (!matchedCode) {
    return next(new ErrorHandler("Invalid activation code", 400));
  }

  // Check if this device already used any code
  const deviceCode = await ActivationCode.findOne({ deviceId });
  if (deviceCode) {
    return next(new ErrorHandler("This device already has an active code", 400));
  }

  // Activate the code
  matchedCode.isUsed = true;
  matchedCode.usedBy =   req.userId;
  matchedCode.deviceId = deviceId;
  matchedCode.usedAt = new Date();
  matchedCode.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
  await matchedCode.save();

  res.status(200).json({
    success: true,
    expiresAt: matchedCode.expiresAt,
    message: "Code activated successfully for 48 hours"
  });
});

// Get active codes (Admin)
exports.getActiveCodes = catchAsyncErrors(async (req, res, next) => {
  const { showAll } = req.query;

  const query = showAll 
    ? {} 
    : { expiresAt: { $gt: new Date() } };

  const codes = await ActivationCode.find(query)
    .populate("usedBy", "name email phone")
    .populate("generatedBy", "name");

  res.status(200).json({
    success: true,
    count: codes.length,
    codes
  });
});

// Revoke code (Admin)
exports.revokeCode = catchAsyncErrors(async (req, res, next) => {
  const code = await ActivationCode.findByIdAndDelete(req.params.id);

  if (!code) {
    return next(new ErrorHandler("Activation code not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Activation code revoked successfully"
  });
});

