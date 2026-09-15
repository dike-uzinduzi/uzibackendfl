const { OAuth2Client } = require("google-auth-library");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

// ─── Firebase Admin init (v14 modular API) ────────────────
let firebaseAuth = null;

try {
  if (!getApps().length) {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "zinduziafrica",
    });
  }
  firebaseAuth = getAuth();
  console.log(
    "✅ Firebase Admin initialised:",
    process.env.FIREBASE_PROJECT_ID || "zinduziafrica"
  );
} catch (err) {
  console.warn("⚠️  Firebase Admin not available:", err.message);
  console.warn("    Google sign-in via Firebase will be disabled.");
}

// ─── Raw Google client (fallback for non-Firebase tokens) ─
const CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (CLIENT_IDS.length === 0) {
  console.warn("⚠️  GOOGLE_CLIENT_IDS not set — raw Google tokens will be rejected.");
}

const googleClient = new OAuth2Client();

// ─── Public API ────────────────────────────────────────────
async function verifyGoogleIdToken(idToken) {
  if (!idToken) throw new Error("Missing idToken");

  // 1. Try Firebase token verification
  if (firebaseAuth) {
    try {
      const decoded = await firebaseAuth.verifyIdToken(idToken);

      if (decoded.email && decoded.email_verified !== false) {
        const name = decoded.name || "";
        const parts = name.split(" ").filter(Boolean);

        return {
          provider: "google",
          providerId: decoded.uid || decoded.sub,
          email: decoded.email.toLowerCase(),
          firstName: parts[0] || null,
          lastName: parts.slice(1).join(" ") || null,
          displayName: name || decoded.email.split("@")[0],
          picture: decoded.picture || null,
        };
      }
    } catch (firebaseErr) {
      console.log("Firebase verify failed:", firebaseErr.message);
      // fall through to raw Google verification
    }
  }

  // 2. Fallback: verify as a raw Google ID token
  if (CLIENT_IDS.length === 0) {
    throw new Error("Social login not configured");
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: CLIENT_IDS,
    });
  } catch (err) {
    console.error("Google verifyIdToken failed:", err.message);
    throw new Error("Invalid Google token");
  }

  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error("Google account has no email");
  if (!payload.email_verified) throw new Error("Google email not verified");

  return {
    provider: "google",
    providerId: payload.sub,
    email: payload.email.toLowerCase(),
    firstName: payload.given_name || null,
    lastName: payload.family_name || null,
    displayName: payload.name || payload.email.split("@")[0],
    picture: payload.picture || null,
  };
}

module.exports = { verifyGoogleIdToken };