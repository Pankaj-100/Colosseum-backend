const express = require("express");
const {signup,signin,verifyOTP,resendOTP,forgotPasswordRequestOTP,forgotPasswordVerifyOTP,forgotPasswordReset} = require("../controllers/authController");
const router = express.Router();

router.post('/signup',signup)
router.post('/signin',signin)
router.post('/verify-otp',verifyOTP)
router.post('/resend-otp',resendOTP)

router.post('/forgot-password/request-otp', forgotPasswordRequestOTP);
router.post('/forgot-password/verify-otp', forgotPasswordVerifyOTP);
router.post('/forgot-password/reset-password', forgotPasswordReset);


module.exports = router;