const Location = require("../models/locationModel");
const catchAsyncErrors = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { uploadLocationImage } = require("../utils/s3");

// Create location with thumbnail
exports.createLocation = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;

  if (!name) return next(new ErrorHandler("Name is required", 400));
  if (!req.file) return next(new ErrorHandler("Thumbnail image is required", 400));

  const { imageUrl } = await uploadLocationImage(req.file, name);

 
  const location = await Location.create({
    name,
    thumbnailUrl: imageUrl
  });

  res.status(201).json({
    success: true,
    message: "Location created",
    location
  });
});

// Get all locations
exports.getAllLocations = catchAsyncErrors(async (req, res, next) => {
  const locations = await Location.find().sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: locations.length,
    locations
  });
});

// Get single location by ID
exports.getLocationById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const location = await Location.findById(id);

  if (!location) return next(new ErrorHandler("Location not found", 404));

  res.status(200).json({
    success: true,
    location
  });
});

// Update location with optional new thumbnail
exports.updateLocation = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const updates = { ...req.body };

  if (req.file) {
    const { imageUrl } = await uploadLocationImage(req.file, updates.name || "location");
    updates.thumbnailUrl = imageUrl;
  }

  const updatedLocation = await Location.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });

  if (!updatedLocation) return next(new ErrorHandler("Location not found", 404));

  res.status(200).json({
    success: true,
    message: "Location updated",
    location: updatedLocation
  });
});

// Delete location
exports.deleteLocation = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const location = await Location.findByIdAndDelete(id);

  if (!location) return next(new ErrorHandler("Location not found", 404));

  res.status(200).json({
    success: true,
    message: "Location deleted successfully"
  });
});
