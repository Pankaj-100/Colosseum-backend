const jwt = require("jsonwebtoken");
const { User } = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

exports.auth = async (req, res, next) => {

  try {
     
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: { message: "Unauthorized. Please send token" } });
    }

    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("+currentToken");
      if (!user ) {
      return res.status(401).json({ error: { message: "user not found" } });
    }

    if (!user || user.currentToken !== authHeader) {
      return res.status(401).json({ error: { message: "Session expired or logged in from another device" } });
    }
 
    req.userId = user._id;

    next();
  } catch (error) {
     console.log("err");
     
    return res.status(401).json({ error: { message: "Unauthorized" } });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    console.log(userId)
    const user = await User.findById(userId).select("+password");

    if (!user)
      return next(new ErrorHandler("Invalid token. User not found.", 401));

    if (user.role !== "admin")
      return next(new ErrorHandler("Restricted.", 401));

    req.user = user;

    next();
  } catch (error) {
    return next(new ErrorHandler("Unauthorized.", 401));
  }
};
