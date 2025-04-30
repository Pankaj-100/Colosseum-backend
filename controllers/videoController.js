const { User } = require("../models/userModel");
const bcryptjs = require("bcryptjs");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");

const mongoose = require("mongoose");
const aws = require("aws-sdk");
const crypto = require("crypto");
const { promisify } = require("util");
const mime = require("mime-types");

const {generateUploadURL}=require("../utils/s3")
const { Video } = require("../models/videoModel");

const {
    extractURLKey,
    appendBucketName,
    awsUrl,
    StringToObjectId,
    generateUniqueId,
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


// Start video upload of largerize
const randomBytes = promisify(crypto.randomBytes);
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_BUCKET_REGION,
  signatureVersion: "v4",
});

const initiateMultipartUpload = async (req, res) => {
  const { videoExtension } = req.body;

  const fileExtension = videoExtension || "mp4";

  const rawBytes = await randomBytes(16);
  // const videoName = rawBytes.toString("hex");

  const uuid = generateUniqueId();
  let key = `admin-uploads/${uuid}.${fileExtension}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    // ContentType: `video/${fileExtension}`,
    ContentType: mime.lookup(fileExtension) || "application/octet-stream",
  };

  const multipartUpload = await s3.createMultipartUpload(params).promise();
  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      uploadId: multipartUpload.UploadId,
      key,
    },
  });
};

const getUploadParts = async (req, res) => {
  const data = req.body;
  const { uploadId, key, partCount } = data;

  if (!uploadId || !key || !partCount) {
    return next(new ErrorHandler(  "Missing required parameters", 400));
  
  }

  const urls = [];

  for (let i = 1; i <= partCount; i++) {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: i,
      Expires: 3600,
    };

    const uploadURL = await s3.getSignedUrlPromise("uploadPart", params);
    urls.push({
      partNumber: i,
      url: uploadURL,
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      urls,
    },
  });
};

const completeMultipartUpload = async (req, res) => {
  const { uploadId, key, parts } = req.body;

  if (!uploadId || !key || !parts || !parts.length) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required parameters" });
  }

  // Format parts array as expected by S3
  const formattedParts = parts.map((part) => ({
    ETag: part.ETag,
    PartNumber: part.PartNumber,
  }));

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: formattedParts,
    },
  };

  const result = await s3.completeMultipartUpload(params).promise();

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      result,
    },
  });
};

const abortMultipartUpload = async (req, res) => {
  const { uploadId, key } = req.body;

  if (!uploadId || !key) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required parameters" });
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
  };

  await s3.abortMultipartUpload(params).promise();

  res.status(200).json({
    success: true,
    message: "Upload aborted successfully",
  });
};


// Save video with meta data in db
const saveVideo = async (req, res, next) => {


     
    let {
      title,
      description,
      thumbnailUrl,
      videoUrl,
      language,
      duration,
      geolocationSettings
   
    } = req.body;
    console.log(req.body)
  
    if (!title || !description || !thumbnailUrl || !videoUrl) {
     
        
        return next(new ErrorHandler("All fields are required", 400));
    }
  
    // Extract keys from url
    if (videoUrl) videoUrl = extractURLKey(videoUrl);
    if (thumbnailUrl) thumbnailUrl = extractURLKey(thumbnailUrl);
 

    const videoData = {
      title,
      description,
      thumbnailUrl,
      videoUrl,
      duration,
      language,
      geolocationSettings,
    };

    // Save video
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
    const allowedUpdates = ['title', 'description', 'thumbnailUrl', 'videoUrl', 
                          'duration', 'language', 'geolocationSettings'];
    
    // Filter valid updates
    const validUpdates = Object.keys(updates).filter(key => allowedUpdates.includes(key));
    const updateData = {};
    
    validUpdates.forEach(key => {
      if (key === 'videoUrl' || key === 'thumbnailUrl') {
        updateData[key] = extractURLKey(updates[key]);
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
  


  
  
module.exports = {getUploadURL,initiateMultipartUpload,getUploadParts,completeMultipartUpload,
  abortMultipartUpload,saveVideo,getVideos , deleteVideo,updateVideoDetails
};
