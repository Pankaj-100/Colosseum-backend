const express = require("express");
const {profile} = require("../controllers/userController");
const router = express.Router();
const { auth } = require("../middlewares/auth");


router.post('/profile',auth,profile)




module.exports = router;