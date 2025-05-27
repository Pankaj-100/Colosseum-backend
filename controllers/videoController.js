
const Location = require('../models/locationModel')
const bcryptjs = require("bcryptjs");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");

const mongoose = require("mongoose");
const aws = require("aws-sdk");
const crypto = require("crypto");
const { promisify } = require("util");
const mime = require("mime-types");

const {generateUploadURL,s3delete}=require("../utils/s3")
const { Video } = require("../models/videoModel");

const {
    extractURLKey,
    awsUrl,
  } = require("../utils/helperFuns");

  // Get presigned url for upload video
 const getUploadURL = async (req, res, next) => {
    const { videoExtension } = req.body;
     const data = await generateUploadURL(videoExtension);
     if (!data.uploadURL) return next(new ErrorHandler("URL not found", 404));
    res.status(200).json({
      success: true,
      message: "get upload url successful",
    data
    });
  };

const randomBytes = promisify(crypto.randomBytes);
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_BUCKET_REGION,
  signatureVersion: "v4",
});
// Save video with meta data in db
const saveVideo = async (req, res, next) => { 
    let {
      title,
      description,
      thumbnailUrl,
      primaryLocation,
      videoUrl,
      language,
      duration,
      geolocationSettings,
      
    } = req.body;
    if (!title || !description || !thumbnailUrl || !videoUrl) {
        return next(new ErrorHandler("All fields are required", 400));
    }
    // Extract keys from url
    if (videoUrl) videoUrl = extractURLKey(videoUrl);
    if (thumbnailUrl) thumbnailUrl = extractURLKey(thumbnailUrl);
 const locationDoc = await Location.findOne({ name: primaryLocation });

if (!locationDoc) {
  return next(new ErrorHandler("Location not found", 404));
}
    const videoData = {
      title,
      description,
      thumbnailUrl,
      videoUrl,
      duration,
     primaryLocation: locationDoc._id, 
      language,
      geolocationSettings,
    };
    const video = await Video.create(videoData);
    if (!video) {
        return next(new ErrorHandler("video not saved", 400));

    }
    res.status(200).json({
      success: true,
      message: "Video saved successfully",
    });
  };
  // Fetch all videos
  const getVideos = async (req, res, next) => {
    const videosQuery = Video.aggregate([
      {
        // Stage 1, append aws url
        $addFields: {
          thumbnailUrl: {
            $concat: [awsUrl, "/", "$thumbnailUrl"],
          },
          videoUrl: {
            $concat: [awsUrl, "/", "$videoUrl"],
          },
        },
      },
    ]);
    const [videos] = await Promise.all([videosQuery]);
 
    const totalVideos = await Video.countDocuments();
    res.status(200).json({  
      success: true,
      data: { videos },
      totalVideos ,
      message: "Videos fetch successfully",
    });
  };

  const getSingleVideo = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
  
    const video = await Video.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(id) }
      },
      {
        $addFields: {
          thumbnailUrl: {
            $concat: [awsUrl, "/", "$thumbnailUrl"]
          },
          videoUrl: {
            $concat: [awsUrl, "/", "$videoUrl"]
          }
        }
      }
    ]);
  
    if (!video || video.length === 0) {
      return next(new ErrorHandler("Video not found", 404));
    }
  
    res.status(200).json({
      success: true,
      data: video[0],
      message: "Video fetched successfully"
    });
  });
  const deleteVideo = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
  console.log(id);
  
    const video = await Video.findById(id);
    if (!video) {
      return next(new ErrorHandler("Video not found", 404));
    }
  
    // Delete both video and thumbnail from S3
    await s3delete(video.videoUrl);
    await s3delete(video.thumbnailUrl);
  
    await Video.findByIdAndDelete(id);
  
    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  });
  
const updateVideoDetails = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;
  
    // Allowed fields for update
    const allowedUpdates = ['title', 'description', 'thumbnailUrl',  
                           'language', 'geolocationSettings'];
    
    // Filter valid updates
    const validUpdates = Object.keys(updates).filter(key => allowedUpdates.includes(key));
    const updateData = {};
    
    validUpdates.forEach(key => {
      if (key === 'videoUrl' || key === 'thumbnailUrl') {
        updateData[key] = extractURLKey(updates[key]);
      } else if (key === 'geolocationSettings') {
        // Validate geolocation settings
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
});
  
 const getFilteredVideos = async (req, res, next) => {
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

  const videos = await Video.aggregate([
    {
      $match: filter,
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
      $lookup: {
        from: "locations",
        localField: "primaryLocation",
        foreignField: "_id",
        as: "locationDetails",
      },
    },
    {
      $unwind: {
        path: "$locationDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: videos,
    message: "Filtered videos fetched successfully",
  });
};

module.exports = {getUploadURL,saveVideo,getVideos , deleteVideo,updateVideoDetails,getSingleVideo,getFilteredVideos
};
