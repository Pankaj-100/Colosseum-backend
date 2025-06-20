// routes/videoRoutes.js
const express = require("express");
const router = express.Router();
const { 
  saveVideo,
  getVideos,
  getSingleVideo,
  deleteVideo,
  updateVideoDetails,
  getFilteredVideos
} = require("../controllers/videoController");
const { auth, isAdmin } = require("../middlewares/auth");
const { 
  imageUpload, 
  videoUpload ,
  uploadMedia
} = require("../utils/multer");

// Upload video (single upload)
router.post( "/",  auth,  isAdmin, uploadMedia, saveVideo);
router.get("/", auth, getVideos);
router.get("/filter",auth, getFilteredVideos);
router.get("/:id", auth, isAdmin, getSingleVideo);
router.delete("/:id", auth, isAdmin, deleteVideo);
router.put( "/:id", auth, isAdmin, uploadMedia,updateVideoDetails);


module.exports = router;