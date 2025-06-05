const Location = require("../models/locationModel");
const catchAsyncErrors = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { uploadLocationImage } = require("../utils/s3");
const { Video } = require("../models/videoModel");

// Create location with thumbnail
exports.createLocation = catchAsyncErrors(async (req, res, next) => {
  const { name, size } = req.body;

  if (!name) return next(new ErrorHandler("Name is required", 400));
  if (!size) return next(new ErrorHandler("Size is required", 400));
  if (!req.file) return next(new ErrorHandler("Thumbnail image is required", 400));

  const { imageUrl } = await uploadLocationImage(req.file, name);

  const location = await Location.create({
    name,
    thumbnailUrl: imageUrl,
    size
  });

  res.status(201).json({
    success: true,
    message: "Location created",
    location
  });
});

// Get all locations with video counts and language statistics
exports.getAllLocations = catchAsyncErrors(async (req, res, next) => {
  // Get all locations
  const locations = await Location.find().sort({ name: 1 });
  
  // Get video counts and language stats for each location
  const locationsWithStats = await Promise.all(
    locations.map(async (location) => {
      // Count total videos in this location
      const videoCount = await Video.countDocuments({ primaryLocation: location._id });
      
      // Get language distribution for videos in this location
      const languageStats = await Video.aggregate([
        { $match: { primaryLocation: location._id } },
        { $group: { 
          _id: "$language", 
          count: { $sum: 1 } 
        }},
        { $sort: { count: -1 } }
      ]);
      
      return {
        ...location.toObject(),
        videoCount,
        languageStats
      };
    })
  );

  res.status(200).json({
    success: true,
    count: locationsWithStats.length,
    locations: locationsWithStats
  });
});

// Get single location by ID with video counts and language stats
exports.getLocationById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const location = await Location.findById(id);

  if (!location) return next(new ErrorHandler("Location not found", 404));

  // Count total videos in this location
  const videoCount = await Video.countDocuments({ primaryLocation: location._id });
  
  // Get language distribution for videos in this location
  const languageStats = await Video.aggregate([
    { $match: { primaryLocation: location._id } },
    { $group: { 
      _id: "$language", 
      count: { $sum: 1 } 
    }},
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    location: {
      ...location.toObject(),
      videoCount,
      languageStats
    }
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