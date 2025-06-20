const app = require("./app");
const path = require('path');
const connectDatabase = require("./config/database");
const express = require("express");

process.on("uncaughtException", (err) => {
  console.log(err);
  // process.exit(0);
});

connectDatabase();
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log("Server is listening on", port);
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  // httpServer.close(() => process.exit(0));
});