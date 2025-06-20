const Location = require("../models/locationModel");
const catchAsyncErrors = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { Video } = require("../models/videoModel");
const fs = require('fs');
const path = require('path');
const { getFileUrl } = require("../utils/helperFuns");

const addUrl = (req, filePath) => {
  if (!filePath) return null;
  return `${process.env.URL}${filePath}`;
};

// Create location
exports.createLocation = catchAsyncErrors(async (req, res, next) => {
  const { name, size } = req.body;

  if (!name || !size) {
    return next(new ErrorHandler('Name and size are required', 400));
  }

  if (!req.files.image) {
    return next(new ErrorHandler('Thumbnail image is required', 400));
  }

  const location = await Location.create({
    name,
    size,
    thumbnailUrl: getFileUrl(req, req.files.image?.[0].path)
  });

  res.status(201).json({
    success: true,
    data: {
      ...location.toObject(),
      thumbnailUrl: addUrl(req, location.thumbnailUrl)
    }
  });
});

// Get all locations with video counts and language statistics
exports.getAllLocations = catchAsyncErrors(async (req, res, next) => {
  // Get all locations
  const locations = await Location.find().sort({ name: 1 });
  
  // Add full URLs to each location
  const locationsWithUrls = locations.map(location => ({
    ...location.toObject(),
    thumbnailUrl: addUrl(req, location.thumbnailUrl)
  }));
  
  // Get video counts and language stats for each location
  const locationsWithStats = await Promise.all(
    locationsWithUrls.map(async (location) => {
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
        ...location,
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

  // Add full URL to the location thumbnail
  const locationWithUrl = {
    ...location.toObject(),
    thumbnailUrl: addUrl(req, location.thumbnailUrl)
  };

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
    data: {
      ...locationWithUrl,
      videoCount,
      languageStats
    }
  });
});

// Update location with optional new thumbnail
exports.updateLocation = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { name, size } = req.body;

  const location = await Location.findById(id);
  if (!location) {
    return next(new ErrorHandler('Location not found', 404));
  }

  const updates = {
    name: name || location.name,
    size: size || location.size
  };

  // Handle thumbnail update if provided
  if (req.files.image?.[0]) {
    // Delete old thumbnail if it exists
    if (location.thumbnailUrl && location.thumbnailUrl.includes('/public/')) {
      const relativePath = location.thumbnailUrl.split('/public/')[1]; 
      const parts = relativePath.split('/');

      if (parts.length >= 2) {
        const folderPath = path.join('public', parts[0], parts[1]); 

        if (fs.existsSync(folderPath)) {
          fs.rmSync(folderPath, { recursive: true, force: true }); 
          console.log(`Deleted folder: ${folderPath}`);
        }
      }
    }
    
    updates.thumbnailUrl = getFileUrl(req, req.files.image?.[0].path);
  }

  const updatedLocation = await Location.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: "Location updated successfully",
    data: {
      ...updatedLocation.toObject(),
      thumbnailUrl: addUrl(req, updatedLocation.thumbnailUrl)
    }
  });
});

// Delete location
exports.deleteLocation = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const location = await Location.findById(id);
  if (!location) {
    return next(new ErrorHandler("Location not found", 404));
  }

  // Delete associated thumbnail file
  if (location.thumbnailUrl && location.thumbnailUrl.includes('/public/')) {
    const relativePath = location.thumbnailUrl.split('/public/')[1]; 
    const parts = relativePath.split('/');

    if (parts.length >= 2) {
      const folderPath = path.join('public', parts[0], parts[1]); 

      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true }); 
        console.log(`Deleted folder: ${folderPath}`);
      }
    }
  }

  await location.remove();

  res.status(200).json({
    success: true,
    message: "Location deleted successfully"
  });
});