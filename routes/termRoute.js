const express = require("express");

const {
  createTerm,deleteTerm,updateTerm,getTermByLanguage,getTerms
} = require("../controllers/termController");

const { auth, isAdmin } = require("../middlewares/auth");

const router = express.Router();

// Admin routes
router.post('/', createTerm);
router.put('/:id', updateTerm);
router.delete('/:id', deleteTerm);

// Public routes
router.get('/', getTerms);
router.get('/:language', getTermByLanguage);

module.exports = router;
