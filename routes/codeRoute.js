const express = require("express");
const router = express.Router();
const {
  generateCodes,
  validateCode,
  getActiveCodes,
  revokeCode,
 
} = require("../controllers/codeController");
const { auth, isAdmin } = require("../middlewares/auth");

// Admin routes
router.post("/generate", auth, isAdmin, generateCodes);
router.get("/active", auth, isAdmin, getActiveCodes);
router.delete("/:id", auth, isAdmin, revokeCode);

// User routes
router.post("/validate", auth, validateCode);

module.exports = router;