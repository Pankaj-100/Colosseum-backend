const app = require("./app");
const path = require('path');
const connectDatabase = require("./config/database");
const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require("express");
process.on("uncaughtException", (err) => {
  console.log(err);
  // process.exit(0);
});

connectDatabase();
const port = process.env.PORT || 4000;
const httpServer = createServer(app);
// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'], 
  }
});
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
httpServer.listen(port, () => {
  console.log("Server is listening on", port);
});
module.exports.io = io;
process.on("unhandledRejection", (err) => {
  console.log(err);
  // httpServer.close(() => process.exit(0));
});