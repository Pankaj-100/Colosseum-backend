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
  console.log("here1");
  
   const data= "heelo"
    console.log("here2");
    // const data = await generateUploadURL(videoExtension);
    console.log("here3");
    // if (!data.uploadURL) return next(new ErrorHandler("URL not found", 404));
    console.log("here4");
    res.status(200).json({
      success: true,
      message: "get upload url successful",
    
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
    throw new BadRequestError("Missing required parameters");
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
   
    } = req.body;
  
    if (!title || !description || !thumbnailUrl || !videoUrl) {
      throw new BadRequestError("Please enter all required fields");
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

    };
  
 

  
    // Save video
    const video = await Video.create(videoData);
  
    if (!video) {
      throw new BadRequestError("Video not saved");
    }
  
    res.status(StatusCodes.CREATED).json({
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
  
    res.status(StatusCodes.OK).json({
      success: true,
      data: { videos },
      message: "Videos fetch successfully",
    });
  };
  // Save video with meta data in db
exports.saveVideo = async (req, res, next) => {
  let {
    title,
    description,
    thumbnailUrl,
    videoUrl,
    course,
    module,
    submodule,
    duration,
    assignment,
  } = req.body;

  if (!title || !description || !thumbnailUrl || !videoUrl) {
    throw new BadRequestError("Please enter all required fields");
  }

  // Extract keys from url
  if (videoUrl) videoUrl = extractURLKey(videoUrl);
  if (thumbnailUrl) thumbnailUrl = extractURLKey(thumbnailUrl);
  if (assignment) assignment = extractURLKey(assignment);

  const videoData = {
    title,
    description,
    thumbnailUrl,
    videoUrl,
    course: course || null,
    module: course && module ? module : null,
    submodule: course && module ? submodule : null,
    duration,
    assignment,
    sequence: 0,
  };

  let isFreeCourse = false;
  let existingCourse = null;

  // Find existing course
  if (course) {
    existingCourse = await courseModel.findById(course);
    if (course && !existingCourse) {
      throw new BadRequestError("Course not found");
    }
    isFreeCourse = existingCourse.isFree;
  }

  if (existingCourse) {
    if (!isFreeCourse) {
      if (!module) throw new BadRequestError("Please enter module id");
      if (!submodule) throw new BadRequestError("Please enter submodule id");

      videoData.module = module;
      videoData.submodule = submodule;
    }

    const sequence = await VideoModel.getNextSequence({
      course,
      submodule,
    });

    videoData.sequence = sequence;
  }

  // Save video
  const video = await VideoModel.create(videoData);

  if (!video) {
    throw new BadRequestError("Video not saved");
  }

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Video saved successfully",
  });
};


  
module.exports = {getUploadURL,initiateMultipartUpload,getUploadParts,completeMultipartUpload,abortMultipartUpload,saveVideo,getVideos
    

};
