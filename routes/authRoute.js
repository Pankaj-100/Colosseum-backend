const express = require("express");
const {signup,signin,verifyOTP,resendOTP,changePassword,forgotPasswordRequestOTP,forgotPasswordVerifyOTP,forgotPasswordReset} = require("../controllers/authController");
const router = express.Router();
const { auth, isAdmin } = require("../middlewares/auth");

router.post('/signup',signup)
router.post('/signin',signin)
router.post('/verify-otp',verifyOTP)
router.post('/resend-otp',resendOTP)

router.post('/forgot-password/request-otp', forgotPasswordRequestOTP);
router.post('/forgot-password/verify-otp', forgotPasswordVerifyOTP);
router.post('/forgot-password/reset-password', forgotPasswordReset);

router.put("/change-password", auth, changePassword);


module.exports = router;