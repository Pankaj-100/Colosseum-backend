const jwt = require("jsonwebtoken");
const { User } = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");

const dotenv = require("dotenv");
dotenv.config({ path: "../config/config.env" });

exports.auth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).send({
        error: {
          message: `Unauthorized.Please Send token in request header`,
        },
      });
    }
    const decoded = jwt.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).send({ error: { message: `Unauthorized` } });
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
