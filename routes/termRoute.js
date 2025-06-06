const express = require("express");

const {
  createTerm,deleteTerm,updateTerm,getTermByLanguage,getTerms
} = require("../controllers/termController");

const { auth, isAdmin } = require("../middlewares/auth");

const router = express.Router();

// Admin routes
router.post('/', auth,isAdmin,createTerm);
router.put('/:id',auth,isAdmin, updateTerm);
router.delete('/:id',auth,isAdmin, deleteTerm);

// Public routes
router.get('/', getTerms);
router.get('/:language', getTermByLanguage);

module.exports = router;
