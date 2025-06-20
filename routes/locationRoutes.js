const express = require("express");
const router = express.Router();
const {
  createLocation,
  updateLocation,
  getAllLocations,
  getLocationById,
  deleteLocation,
} = require("../controllers/locationController");
const { auth, isAdmin } = require("../middlewares/auth");
const {  uploadMedia, } = require("../utils/multer");

router.post(
  "/", 
  auth, 
  isAdmin, 
  uploadMedia,
  createLocation
);


router.put(
  "/:id", 
  auth, 
  isAdmin, 
   uploadMedia, 
  updateLocation
);

// Get all locations
router.get("/", getAllLocations);

// Get single location by ID
router.get("/:id", getLocationById);

// Delete location
router.delete("/:id", auth, isAdmin, deleteLocation);

module.exports = router;