const express = require("express");
const {  getUploadURL,
    getVideos,
    initiateMultipartUpload,
    getUploadParts,
    completeMultipartUpload,
    abortMultipartUpload,saveVideo,
    getSingleVideo,
    deleteVideo,
    updateVideoDetails
  } = require("../controllers/videoController");
const { auth, isAdmin } = require("../middlewares/auth");

const router = express.Router();

router.route("/get-upload-url").post(getUploadURL);
router.route("/save").post( saveVideo);
router.route("/").get(   getVideos);

router.route("/:id").get(getSingleVideo);
router.route("/:id").put( updateVideoDetails);
router.route("/:id").delete(  deleteVideo);


router.route("/uploads/generate-urls").post( getUploadParts);
router.route("/uploads/initiate").post(auth, isAdmin, initiateMultipartUpload);
router.route("/uploads/complete").post(auth, isAdmin, completeMultipartUpload);
router.route("/uploads/abort").post(auth, isAdmin, abortMultipartUpload);



module.exports = router;