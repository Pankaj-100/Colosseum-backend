const aws = require("aws-sdk");
const SDK = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const crypto = require("crypto");
const { promisify } = require("util");
const dotenv = require("dotenv");
const multer = require("multer");
const S3 = require("aws-sdk/clients/s3");
const sharp = require("sharp");
const mime = require("mime-types");
const { generateUniqueId } = require("./helperFuns");
dotenv.config({ path: "./config/config.env" });
const randomBytes = promisify(crypto.randomBytes);

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_BUCKET_REGION,
  signatureVersion: "v4",
});
//Profile Image Upload/Update
exports.uploadProfileImage = async (file, userId) => {
  if (!file || !file.mimetype.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }
  const buffer = await sharp(file.buffer)
    .webp({ quality: 80 })
    .resize(500, 500)
    .toBuffer();

  const key = `profile-images/${userId}.webp`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
    // ACL: 'public-read'
  };
  const data = await s3.upload(params).promise();
  
  return {
    imageUrl: data.Location,
    imageKey: key
  };
};

exports.deleteProfileImage = async (userId) => {
  const key = `profile-images/${userId}.webp`;
  
  try {
    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    }).promise();
    return true;
  } catch (error) {
    console.error('Error deleting profile image:', error);
    return false;
  }
};


exports.generateUploadURL = async (fileExtension = "mp4") => {
  const rawBytes = await randomBytes(16);
  const videoName = rawBytes.toString("hex");

  const uuid = generateUniqueId();
  let key = `${uuid}.${fileExtension}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Expires: 2400,
    // ContentType: `video/${fileExtension}`,
    ContentType: mime.lookup(fileExtension) || "application/octet-stream",
  };

  const uploadURL = await s3.getSignedUrlPromise("putObject", params);
  return { uploadURL, videoName };
};

exports.s3Uploadv4 = async (file, folder, type = null) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  if (!file || (!type ? !file.mimetype : false)) {
    throw new Error("Invalid file input");
  }

  const fileType = file.mimetype?.split("/")[0]; // Extract file type (image, video, etc.)
  const extension = file.originalname?.split(".")?.pop(); // Extract file extension
  const timestamp = Date.now().toString();
  let key, body, contentType;

  const uuid = generateUniqueId();
  const folderName = folder || "uploads";
  key = `${folderName}/${uuid}`;

  if (fileType === "image") {
    // Convert image to WebP for optimization
    key = `${key}.webp`;
    body = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
    contentType = "image/webp";
  } else if (type === "invoice") {
    key = `${key}.pdf`;
    (body = file), (contentType = "application/pdf");
  } else {
    // Handle other file types dynamically

    body = file.buffer;
    contentType = file.mimetype; // Use original content type
  }

  console.log("Key", key);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  const data = await s3.upload(params).promise();
  data.Location = data.Key;
  return data;
};

exports.s3Uploadv4Query = async (file) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const uuid = generateUniqueId();
  let key = `queries/${uuid}`;

  let fileBuffer = file.buffer;
  let contentType = file.mimetype;

  // Optionally process images for optimization
  if (file.mimetype.startsWith("image/")) {
    key = `${key}.webp`;
    fileBuffer = await sharp(file.buffer).toBuffer();
    contentType = file.mimetype; // Maintain original content type
  }

  // S3 upload parameters
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType, // Dynamically assign the file's MIME type
  };

  // Upload to S3
  const data = await s3.upload(params).promise();
  data.Location = data.Key;
  return data;
};

exports.s3AdminUploadv4 = async (file, folder) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });
  let buffer = file.buffer;

  const uuid = generateUniqueId();
  const folderName = folder || "uploads";
  let key = `${folderName}/${uuid}`;
  let contentType = file.mimetype;

  // Check if file is an image and convert it to WebP
  if (file.mimetype.startsWith("image/")) {
    buffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
    key = `${key}.webp`; // Change extension to .webp
    contentType = "image/webp";
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };

  const data = await s3.upload(params).promise();
  data.Location = data.Key;
  return data;
};

exports.s3UploadMulti = async (files) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const params = files.map((file) => {
    return {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `resources/${Date.now().toString()}-${
        file.originalname ? file.originalname : "not"
      }`,
      Body: file.buffer,
    };
  });

  return await Promise.all(params.map((param) => s3.upload(param).promise()));
};

exports.s3delete = async (Key) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key,
  };

  return await s3.deleteObject(param).promise();
};

exports.s3UploadMulti = async (files) => {
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const params = files.map((file) => {
    return {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `resources/${Date.now().toString()}-${
        file.originalname ? file.originalname : "not"
      }`,
      Body: file.buffer,
    };
  });

  return await Promise.all(params.map((param) => s3.upload(param).promise()));
};

exports.uploadLocationImage = async (file, locationName) => {
  if (!file || !file.mimetype.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const buffer = await sharp(file.buffer)
    .webp({ quality: 80 })
    .resize(600, 400) // Adjust dimensions if needed
    .toBuffer();

  const sanitizedName = locationName.toLowerCase().replace(/\s+/g, "-");
  const key = `location-thumbnails/${sanitizedName}-${Date.now()}.webp`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: "image/webp",
  };

  const data = await s3.upload(params).promise();

  return {
    imageUrl: data.Location,
    imageKey: key,
  };
};


const storage = multer.memoryStorage();

const blockedMimeTypes = [
  "application/x-msdownload", // .exe
  "application/x-dosexec", // .exe
  "application/x-sh", // .sh
  "application/x-bat", // .bat
  "application/x-php", // .php
  "application/javascript", // .js
  "application/x-csh", // .csh
  "text/x-python", // .py
  "text/x-shellscript", // Shell scripts
];

const fileFilter = async (req, file, cb) => {
  if (
    (file.mimetype.split("/")[0] === "image" ||
      file.mimetype.split("/")[0] === "application" ||
      file.mimetype.split("/")[0] === "video") &&
    !blockedMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

// Configure multer
exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 20000, files: 4 },
});
