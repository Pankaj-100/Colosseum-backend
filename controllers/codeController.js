const crypto = require('crypto');
const ActivationCode = require("../models/activationCodeModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");

// HMAC secret (for frontend validation)
const HMAC_SECRET = process.env.HMAC_SECRET || 'supersecretkey123';

// AES secret (for decrypting plain code to admin)
const ENC_SECRET = process.env.ENC_SECRET || 'encryptionsecret1234567890123456'; // must be 32 chars
const IV = Buffer.alloc(16, 0); // 16-byte IV for AES

// HMAC hash generator (frontend-compatible)
function hashCode(code) {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(code)
    .digest("hex");
}

// AES Encrypt / Decrypt
function encrypt(text) {
  const cipher = crypto.createCipheriv("aes-256-cbc", ENC_SECRET, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENC_SECRET, IV);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Helper: generate random 6-digit codes
const generateActivationCode = () => Math.floor(1000 + Math.random() * 9000).toString();

// ✅ Admin: Generate activation codes (returns plain codes to admin)
exports.generateCodes = catchAsyncErrors(async (req, res, next) => {
  const { count } = req.body;

  if (!count || count <= 0 || count > 100) {
    return next(new ErrorHandler("Count must be between 1 and 100", 400));
  }

  const plainCodes = new Set();
  const hashedRecords = [];

  while (plainCodes.size < count) {
    const code = generateActivationCode();
    const hash = hashCode(code);
    const encrypted = encrypt(code);

    // Ensure uniqueness
    if ([...plainCodes].some(c => hashCode(c) === hash)) continue;

    plainCodes.add(code);

    hashedRecords.push({
      hashedCode: hash,
      encryptedCode: encrypted,
      generatedBy: req.user._id
    });
  }

  try {
    await ActivationCode.insertMany(hashedRecords, { ordered: false });
  } catch (err) {
    return next(new ErrorHandler("Failed to insert activation codes", 500));
  }

  res.status(201).json({
    success: true,
    count: plainCodes.size,
    codes: Array.from(plainCodes),
    message: "Activation codes generated"
  });
});

// ✅ Admin: View all codes with decrypted plainCode
exports.getActiveCodes = catchAsyncErrors(async (req, res, next) => {
  const codes = await ActivationCode.find()
    .populate("generatedBy", "name")
    .lean();

  const codesWithPlain = codes.map(c => ({
    ...c,
    plainCode: decrypt(c.encryptedCode)
  }));

  res.status(200).json({
    success: true,
    count: codesWithPlain.length,
    codes: codesWithPlain
  });
});

// ✅ Admin: Revoke a code using the plain code
exports.revokeCode = catchAsyncErrors(async (req, res, next) => {
  const { plainCode } = req.body;
  if (!plainCode) return next(new ErrorHandler("plainCode is required", 400));

  const hash = hashCode(plainCode);
  const result = await ActivationCode.findOneAndDelete({ hashedCode: hash });

  if (!result) {
    return next(new ErrorHandler("Code not found or already revoked", 404));
  }

  res.status(200).json({
    success: true,
    message: "Code revoked"
  });
});

// ✅ Public: Send all hashed codes (for offline validation on frontend)
exports.getCodeHashes = catchAsyncErrors(async (req, res, next) => {
  const codes = await ActivationCode.find().select("hashedCode -_id");

  res.status(200).json({
    success: true,
    count: codes.length,
    hashes: codes.map(c => c.hashedCode)
  });
});
