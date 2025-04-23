const express = require("express");
const {  getUploadURL,
    getVideos,
    initiateMultipartUpload,
    getUploadParts,
    completeMultipartUpload,
    abortMultipartUpload,saveVideo
  } = require("../controllers/videoController");
const { auth, isAdmin } = require("../middlewares/auth");

const router = express.Router();
router.route("/uploads/generate-urls").post(auth, isAdmin, getUploadParts);
router.route("/get-upload-url").post( getUploadURL);
router.route("/").get( getVideos).post( saveVideo);
router.route("/uploads/initiate").post(auth, isAdmin, initiateMultipartUpload);

router.route("/uploads/complete").post(auth, isAdmin, completeMultipartUpload);
router.route("/uploads/abort").post(auth, isAdmin, abortMultipartUpload);

module.exports = router;