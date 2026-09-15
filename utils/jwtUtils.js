const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TTL  = "7d";       // session token
const PENDING_TTL = "15m";      // signup-pending scope

if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function generateSignupPendingToken(userId, provider) {
  return jwt.sign(
    { id: userId, scope: "signup_pending", provider },
    JWT_SECRET,
    { expiresIn: PENDING_TTL }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, generateSignupPendingToken, verifyToken };