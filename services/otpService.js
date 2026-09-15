const crypto = require("crypto");
const { Op } = require("sequelize");
const { OtpToken } = require("../models");

const TTL_MINUTES       = 10;
const MAX_ATTEMPTS      = 5;
const RESEND_COOLDOWN_S = 60;

function generateCode() {
  // 6-digit numeric code, cryptographically random
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Issue a fresh OTP for the given email + purpose.
 * Cancels any prior un-consumed OTP for the same email+purpose.
 * Enforces a 60-second resend cooldown.
 */
async function issueOtp(email, purpose, meta = null) {
  const normalised = String(email).toLowerCase().trim();

  const recent = await OtpToken.findOne({
    where: {
      email: normalised,
      purpose,
      consumedAt: null,
      createdAt: { [Op.gt]: new Date(Date.now() - RESEND_COOLDOWN_S * 1000) },
    },
  });

  if (recent) {
    const err = new Error(
      `Please wait ${RESEND_COOLDOWN_S} seconds before requesting another code.`
    );
    err.status = 429;
    throw err;
  }

  // Invalidate prior unconsumed OTPs for the same email+purpose
  await OtpToken.update(
    { consumedAt: new Date() },
    { where: { email: normalised, purpose, consumedAt: null } }
  );

  const code = generateCode();
  const codeHash = await OtpToken.hashCode(code);

  await OtpToken.create({
    email: normalised,
    purpose,
    codeHash,
    meta,
    expiresAt: new Date(Date.now() + TTL_MINUTES * 60 * 1000),
  });

  return code;
}

/**
 * Verify + consume an OTP. Returns the token row on success.
 * Throws on any failure with a generic message (no enumeration).
 */
async function consumeOtp(email, purpose, code) {
  const normalised = String(email).toLowerCase().trim();

  const token = await OtpToken.findOne({
    where: { email: normalised, purpose, consumedAt: null },
    order: [["createdAt", "DESC"]],
  });

  if (!token) throw genericError();
  if (token.expiresAt < new Date()) throw genericError();
  if (token.attempts >= MAX_ATTEMPTS) throw genericError();

  const ok = await OtpToken.verifyCode(code, token.codeHash);
  if (!ok) {
    token.attempts += 1;
    await token.save();
    throw genericError();
  }

  token.consumedAt = new Date();
  await token.save();
  return token;
}

function genericError() {
  const err = new Error("Invalid or expired OTP");
  err.status = 400;
  return err;
}

module.exports = { issueOtp, consumeOtp };