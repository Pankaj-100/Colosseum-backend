const express = require("express");
const {
  login,
  getDashboardData,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser
} = require("../controllers/adminController");

const { auth, isAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post("/login", login);

// Protected admin routes
router.get("/getDashboardData", auth, isAdmin, getDashboardData);
router.get("/get_AllUsers", auth, isAdmin, getAllUsers);
router.get("/user_details/:id", auth, isAdmin, getUser);
router.put("/update_user/:id", auth, isAdmin, updateUser);
router.delete("/delete_user/:id", auth, isAdmin, deleteUser);

module.exports = router;