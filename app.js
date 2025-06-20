const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/error");
const dotenv = require("dotenv");
const app = express();
const path = require('path');
const authRoute = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");
const videoRoute = require("./routes/videoRoute");
const codeRoute=require("./routes/codeRoute");
const userRoutes=require("./routes/userRoutes");
const termRoute=require("./routes/termRoute")
const locationRoutes= require("./routes/locationRoutes")
const notificationRoute= require("./routes/notificationRoutes")
dotenv.config({ path: "./config/config.env" });

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'], // allow content-type
  
  })
);
app.get("/", (req, res, next) => res.json({ anc: "abc" }));

// Serve static files from public directory

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use("/api/auth", authRoute);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoute);
app.use("/api/video", videoRoute);
app.use("/api/code", codeRoute);
app.use("/api/location", locationRoutes);
app.use("/api/terms", termRoute);
app.use("/api/notification", notificationRoute);


app.all('*', async (req, res) => {
  res.status(404).json({error:{message:"Not Found. Kindly Check the API path as well as request type"}})
});
app.use(errorMiddleware);

module.exports = app;
