const express = require("express");
const {profile,uploadProfileImages,updateProfile,getVideos,deleteaccount} = require("../controllers/userController");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const { 

  uploadMedia
} = require("../utils/multer");


router.get('/profile',auth,profile)
router.post('/profile/image', auth,uploadMedia, uploadProfileImages);
router.put('/profile', auth, uploadMedia, updateProfile);
router.get('/video', auth,  getVideos);
router.delete("/delete-account", auth,  deleteaccount);



module.exports = router;