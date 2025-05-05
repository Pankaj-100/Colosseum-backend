const express = require("express");
const router = express.Router();
const {
  generateCodes,
  getActiveCodes,
  revokeCode,
  getCodeHashes
} = require("../controllers/codeController");

const { auth, isAdmin } = require("../middlewares/auth");

// Admin routes
router.post("/generate", auth, isAdmin, generateCodes);
router.get("/active", auth, isAdmin, getActiveCodes);
router.delete("/revoke", auth, isAdmin, revokeCode);

// Public route for mobile app
router.get("/hashes", getCodeHashes);

module.exports = router;
