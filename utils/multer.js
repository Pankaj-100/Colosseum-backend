const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Function to generate a unique folder name for each upload
const generateFolderName = () => {
  return Date.now().toString();
};

// Function to generate a unique file name
const generateFileName = (file) => {
  return `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
};

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destination = 'public/images';
    fs.mkdirSync(destination, { recursive: true });
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file);
    cb(null, fileName);
  },
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destination = 'public/videos';
    fs.mkdirSync(destination, { recursive: true });
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const fileName = generateFileName(file);
    cb(null, fileName);
  },
});


const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 1000000, // 1MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Please upload a valid image file"));
    }
    cb(null, true);
  },
}).single("image");



// Single video upload middleware
const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 50000000, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(mp4|mkv|avi)$/)) {
      return cb(new Error("Please upload a valid video file"));
    }
    cb(null, true);
  },
}).single("video");

// Combined storage for both images and videos with unique folders
const mediaStorage = multer.diskStorage({
  
  destination: (req, file, cb) => {
  
    const uploadId = generateFolderName();
    let destination;
    
    if (file.fieldname === 'image') {
      destination = path.join('public', 'images', uploadId);
    } else if (file.fieldname === 'video') {
      destination = path.join('public', 'videos', uploadId);
    } else {
      return cb(new Error('Invalid field name'));
    }
    
    fs.mkdirSync(destination, { recursive: true });
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  }
});

// Combined upload middleware for both image and video
const uploadMedia = multer({
  
  storage: mediaStorage,
  fileFilter: (req, file, cb) => {
 
    if (file.fieldname === 'image') {
      
      if (!file.originalname.match(/\.(png|jpg|jpeg|webp)$/)) {
        return cb(new Error("Please upload a valid image file"));
      }
      cb(null, true);
    } else if (file.fieldname === 'video') {
      if (!file.originalname.match(/\.(mp4|mkv|avi)$/)) {
        return cb(new Error("Please upload a valid video file"));
      }
      cb(null, true);
    } else {
      cb(new Error('Unexpected field'));
    }
  },
  limits: {
    fileSize: {
      image: 5000000, // 5MB for images
      video: 50000000 // 50MB for videos
    }
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// Export all upload middlewares
module.exports = {
  imageUpload,
  videoUpload,
  uploadMedia
};

