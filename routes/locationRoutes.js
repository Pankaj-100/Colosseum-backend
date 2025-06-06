const express = require("express");
const router = express.Router();
const { upload } = require("../utils/s3");
const {
  createLocation,
  updateLocation,
  getAllLocations,
  deleteLocation,
} = require("../controllers/locationController");

const { auth, isAdmin } = require("../middlewares/auth");

router.post("/", auth, isAdmin, upload.single("thumbnail"), createLocation);
router.put("/:id", auth, isAdmin, upload.single("thumbnail"), updateLocation);
router.get("/",  getAllLocations);
router.delete("/:id", auth, isAdmin, deleteLocation);

module.exports = router;
