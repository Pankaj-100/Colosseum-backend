const express = require("express");
const {signup,signin,verifyOTP,resendOTP} = require("../controllers/authController");
const router = express.Router();

router.post('/signup',signup)
router.post('/signin',signin)
router.post('/verify-otp',verifyOTP)
router.post('/resend-otp',resendOTP)



module.exports = router;