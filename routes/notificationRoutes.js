const express = require("express");
const {
  getNotifications,
  markAsSeen,
} =require( "../controllers/notificationController.js");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.get("/", auth, getNotifications);
router.put("/:id/seen",  auth,markAsSeen);
module.exports = router;
