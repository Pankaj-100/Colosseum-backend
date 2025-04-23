const UAParser = require("ua-parser-js");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

// Get device info
exports.getDeviceData = (req) => {
  const parser = new UAParser(req.headers["user-agent"]);
  const ua = parser.getResult();
  return ua;
};

// Generate unqiue device identifier
exports.generateDeviceId = (req) => {
  const ua = exports.getDeviceData(req);

  // Create a unique device identifier using multiple factors
  const deviceFactors = [
    ua.os.name,
    req.ip, // IP address as part of device fingerprint

    // ua.os.name,          // OS name (e.g., macOS, Windows, Android)
    // ua.os.version,       // OS version (e.g., 10.15.7, 11.0)
    // ua.device.type || "desktop", // Device type (e.g., desktop, mobile)
    // ua.cpu.architecture || "x64", // CPU architecture (e.g., x64, arm64)
  ]
    .filter(Boolean)
    .join("|");

  return require("crypto")
    .createHash("sha256")
    .update(deviceFactors)
    .digest("hex");
};


// Extract path form AWS bucket url
exports.extractURLKey = (url) => {
  return url.replace(/^https?:\/\/[^/]+\/([^?]+)(\?.*)?$/, "$1");
};

exports.awsUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com`;

// Append AWS bucket name before the file path
exports.appendBucketName = (url) => {
  return `${exports.awsUrl}/${url}`;
};

exports.StringToObjectId = (str) => {
  return new mongoose.Types.ObjectId(str);
};



exports.generateUniqueId = () => {
  const uuid = uuidv4();
  return uuid;
};
