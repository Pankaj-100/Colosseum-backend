const express = require("express");
const {profile,uploadProfileImages,updateProfile,getVideos,deleteaccount} = require("../controllers/userController");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const { upload } = require('../utils/s3');


router.get('/profile',auth,profile)
router.post('/profile/image', auth, upload.single('image'), uploadProfileImages);
router.put('/profile', auth, upload.single('profileImage'), updateProfile);
router.get('/video', auth,  getVideos);
router.delete("/delete-account", auth,  deleteaccount);



module.exports = router;