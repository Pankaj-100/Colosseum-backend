const Location = require('../models/locationModel');
const bcryptjs = require("bcryptjs");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");
const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");
const { Video } = require("../models/videoModel");
const {getFileUrl} = require("../utils/helperFuns")
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

const saveVideo = async (req, res, next) => {
  let { title, description, language, duration, geolocationSettings, primaryLocation } = req.body;

  duration = JSON.parse(req.body.duration);
  geolocationSettings = JSON.parse(req.body.geolocationSettings);
  if (!req.files || !req.files.video) {
    return next(new ErrorHandler('Video and thumbnail are required', 400));
  }

  const videoFile = req.files.video[0];
  const thumbnailFile = req.files.image?.[0];

  const locationDoc = await Location.findOne({ name: primaryLocation });
  if (!locationDoc) {
    return next(new ErrorHandler("Location not found", 404));
  }
console.log(geolocationSettings);
  const videoData = {
    title,
    description,
    videoUrl: getFileUrl(req, videoFile.path),
    thumbnailUrl: thumbnailFile ? getFileUrl(req, thumbnailFile.path) : null,
    duration,
    primaryLocation: locationDoc._id,
    language,
    geolocationSettings,
  };

  const video = await Video.create(videoData);

  res.status(201).json({
    success: true,
    data: video,
  });
};
const addUrl = (req, filePath) => {
  if (!filePath) return null;
  return `${process.env.URL}${filePath}`;
};


// Get all videos
const getVideos = async (req, res, next) => {
  const video = await Video.find().populate('primaryLocation');
  // Add full URLs to each video
  const videos = video.map(video => ({
    ...video.toObject(),
    videoUrl: addUrl(req, video.videoUrl),
    thumbnailUrl: addUrl(req, video.thumbnailUrl)
  }));
  
  res.status(200).json({
    success: true,
    count: videosWithUrls.length,
    data: { videos: videos }
  });
};


// Get single video
const getSingleVideo = async (req, res, next) => {
  const video = await Video.findById(req.params.id).populate('primaryLocation');

  if (!video) {
    return next(new ErrorHandler('Video not found', 404));
  }

  // Add full URLs to the video
  const videos = {
    ...video.toObject(),
    videoUrl: addUrl(req, video.videoUrl),
    thumbnailUrl: addUrl(req, video.thumbnailUrl)
  };

  res.status(200).json({
    success: true,
    data: videos
  });
};

// Delete video
const deleteVideo = async (req, res, next) => {
  const video = await Video.findById(req.params.id);
  if (!video) {
    return next(new ErrorHandler('Video not found', 404));
  }

[video.videoUrl, video.thumbnailUrl].forEach(url => {
  if (url && url.includes('/public/')) {
    const relativePath = url.split('/public/')[1]; 
    const parts = relativePath.split('/');

    if (parts.length >= 2) {
      const folderPath = path.join('public', parts[0], parts[1]); 

      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true }); 
        console.log(`Deleted folder: ${folderPath}`);
      }
    }
  }
});


  await video.remove();

  res.status(200).json({
    success: true,
    message: 'Video deleted successfully'
  });
};

// Update video details
const updateVideoDetails = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedUpdates = ['title', 'description', 'language', 'geolocationSettings'];
  const validUpdates = Object.keys(updates).filter(key => allowedUpdates.includes(key));
  const updateData = {};

  validUpdates.forEach(key => {
    if (key === 'geolocationSettings') {
      if (updates[key] && updates[key].locations) {
        updateData[key] = {
          isGeolocationEnabled: updates[key].isGeolocationEnabled || false,
          locations: updates[key].locations.map(loc => ({
            type: 'Point',
            coordinates: Array.isArray(loc.coordinates) ? loc.coordinates : [0, 0],
            radius: Number(loc.radius) || 100,
            locationName: loc.locationName || ''
          }))
        };
      }
    } else {
      updateData[key] = updates[key];
    }
  });

  // Handle thumbnail update if provided
  if (req.files && req.files.image) {
    const thumbnailFile = req.files.image[0];
    updateData.thumbnailUrl = getFileUrl(req, thumbnailFile.path);
    
    // Delete old thumbnail if it exists
    const video = await Video.findById(id);
    
  [ video.thumbnailUrl].forEach(url => {
  if (url && url.includes('/public/')) {
    const relativePath = url.split('/public/')[1]; 
    const parts = relativePath.split('/');

    if (parts.length >= 2) {
      const folderPath = path.join('public', parts[0], parts[1]); 

      if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true }); 
        console.log(`Deleted folder: ${folderPath}`);
      }
    }
  }
});
  }

  const video = await Video.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!video) {
    return next(new ErrorHandler("Video not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Video updated successfully",
    data: video,
  });
};
const getFilteredVideos = async (req, res, next) => {
  console.log("1234")
  const { language, primaryLocation } = req.query;
  const filter = {};


  if (language) filter.language = language;
  if (primaryLocation) {
    try {
      filter.primaryLocation = new mongoose.Types.ObjectId(primaryLocation);
    } catch (error) {
      return next(new ErrorHandler("Invalid location ID", 400));
    }
  }

  const video = await Video.find(filter).populate('primaryLocation');
  
  // Add full URLs to each video
  const videos = video.map(video => ({
    ...video.toObject(),
    videoUrl: addUrl(req, video.videoUrl),
    thumbnailUrl: addUrl(req, video.thumbnailUrl)
  }));

  res.status(200).json({
    success: true,
    data: videos,
    message: "Filtered videos fetched successfully"
  });
};

module.exports = {
  saveVideo,
  getVideos,
  deleteVideo,
  updateVideoDetails,
  getSingleVideo,
 getFilteredVideos
};
