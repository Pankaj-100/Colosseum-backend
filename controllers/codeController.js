const crypto = require('crypto');
const ActivationCode = require("../models/activationCodeModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../utils/catchAsyncError");

// HMAC secret (for frontend validation)
const HMAC_SECRET = process.env.HMAC_SECRET || 'bb06e81cd130138b36b8898bc5a';

// AES secret (for decrypting plain code to admin)
const ENC_SECRET = process.env.ENC_SECRET || 'encryptionsecret1234567890123456'; 
const IV = Buffer.alloc(16, 0); // 16-byte IV for AES

// HMAC hash generator 
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

// Helper: generate random 4-digit codes
const generateActivationCode = () => Math.floor(1000 + Math.random() * 9000).toString();


exports.generateCodes = catchAsyncErrors(async (req, res, next) => {
  const { count, validityDays } = req.body;

  if (!count || count <= 0 || count > 100) {
    return next(new ErrorHandler("Count must be between 1 and 100", 400));
  }

  if (!validityDays || validityDays <= 0) {
    return next(new ErrorHandler("validityDays must be a positive number", 400));
  }

  const now = new Date();
  const validFrom = now;
  const validTill = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000); // add X days

  const plainCodes = new Set();
  const hashCodes = new Set();
  const hashedRecords = [];

  while (plainCodes.size < count) {
    const code = generateActivationCode();
    const hash = hashCode(code);
    const encrypted = encrypt(code);

    if ([...plainCodes].some(c => hashCode(c) === hash)) continue;

    plainCodes.add(code);
    hashCodes.add(hash);

    hashedRecords.push({
      hashedCode: hash,
      encryptedCode: encrypted,
      generatedBy: req.user._id,
      validFrom,
      validTill
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
    hashcodes: Array.from(hashCodes),
    validFrom,
    validTill,
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
    codes: codesWithPlain,
   
  });
});

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

exports.getCodeHashes = catchAsyncErrors(async (req, res, next) => {
  const codes = await ActivationCode.find().select("hashedCode validFrom validTill -_id");

  res.status(200).json({
    success: true,
    count: codes.length,
    hashes: codes.map(c => ({
      hashedCode: c.hashedCode,
      validFrom: c.validFrom,
      validTill: c.validTill
    }))
  });
});

