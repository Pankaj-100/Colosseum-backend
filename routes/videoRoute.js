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
router.route("/get-upload-url").post(auth, isAdmin, getUploadURL);
router.route("/").get(auth, isAdmin, getVideos).post(auth, isAdmin, saveVideo);
router.route("/uploads/initiate").post(auth, isAdmin, initiateMultipartUpload);

router.route("/uploads/complete").post(auth, isAdmin, completeMultipartUpload);
router.route("/uploads/abort").post(auth, isAdmin, abortMultipartUpload);

module.exports = router;