const express = require("express");
const {  getUploadURL,
    getVideos,
  saveVideo,
    getSingleVideo,
    deleteVideo,
    updateVideoDetails,
    getFilteredVideos,
  } = require("../controllers/videoController");
const { auth, isAdmin } = require("../middlewares/auth");

const router = express.Router();

router.route("/get-upload-url").post(auth, isAdmin,getUploadURL);
router.route("/save").post(auth, isAdmin,  saveVideo);
router.route("/").get( auth,  getVideos);
router.route("/filter").get(auth,getFilteredVideos);
 
router.route("/:id").get(auth,isAdmin,getSingleVideo);
router.route("/:id").put( auth, isAdmin,updateVideoDetails);
router.route("/:id").delete( auth, isAdmin, deleteVideo);






module.exports = router;