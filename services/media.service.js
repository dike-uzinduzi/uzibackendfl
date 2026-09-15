const crypto = require("crypto");
const axios = require("axios");
const sharp = require("sharp");
const { PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const r2 = require("../config/r2");
const { SLOTS } = require("../config/media");
const Profile = require("../models/Profile");
const Artist = require("../models/Artist");
const CorporateProfile = require("../models/CorporateProfile");
const Album = require("../models/Album");
const Plaque = require("../models/Plaque");
const News = require("../models/News");

const PRESIGN_TTL_SECONDS = 300;

// ─── Presign ──────────────────────────────────────────────────
exports.presign = async ({ userId, slot, contentType, contentLength }) => {
  const rule = SLOTS[slot];
  if (!rule) throw new AppError(400, "Unknown media slot");

  if (!rule.types.includes(contentType)) {
    throw new AppError(400, `Unsupported type. Allowed: ${rule.types.join(", ")}`);
  }
  if (contentLength > rule.maxBytes) {
    throw new AppError(400, `File too large. Max ${(rule.maxBytes / 1024 / 1024).toFixed(1)} MB`);
  }

  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const key = `${rule.prefix}/${userId}/${crypto.randomUUID()}.${ext}`;

  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(r2, cmd, { expiresIn: PRESIGN_TTL_SECONDS });

  return {
    uploadUrl,
    key,
    publicUrl: `${process.env.MEDIA_CDN_BASE}/${key}`,
    expiresIn: PRESIGN_TTL_SECONDS,
  };
};

// ─── Confirm ──────────────────────────────────────────────────
exports.confirm = async ({ userId, slot, key, context }) => {
  const rule = SLOTS[slot];
  if (!rule) throw new AppError(400, "Unknown media slot");

  // 1. Key must belong to this user and slot — no cross-user path injection
  const expectedPrefix = `${rule.prefix}/${userId}/`;
  if (!key.startsWith(expectedPrefix) || key.includes("..")) {
    throw new AppError(403, "Invalid upload key");
  }

  // 2. Object exists in R2
  try {
    await r2.send(new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    }));
  } catch {
    throw new AppError(400, "Upload not found. Did you PUT the file?");
  }

  // 3. Fetch head bytes and verify with sharp (S3 metadata is client-controlled)
  const url = `${process.env.MEDIA_CDN_BASE}/${key}`;
  const head = await axios.get(url, {
    responseType: "arraybuffer",
    headers: { Range: "bytes=0-131071" },  // 128 KB header slice for dimensions
    maxContentLength: 512 * 1024,
    timeout: 10_000,
  });

  let meta;
  try {
    meta = await sharp(Buffer.from(head.data)).metadata();
  } catch {
    await safeDelete(key);   // burn the bad file immediately
    throw new AppError(400, "Not a valid image");
  }

  if (meta.width < rule.minDim || meta.height < rule.minDim) {
    await safeDelete(key);
    throw new AppError(400, `Minimum dimensions: ${rule.minDim}×${rule.minDim}`);
  }
  if (meta.width > rule.maxDim || meta.height > rule.maxDim) {
    await safeDelete(key);
    throw new AppError(400, `Maximum dimensions: ${rule.maxDim}×${rule.maxDim}`);
  }

  if (rule.aspect) {
    const [aw, ah] = rule.aspect;
    const target = aw / ah;
    const actual = meta.width / meta.height;
    const tolerance = rule.aspectTolerance ?? 0.02;
    if (Math.abs(actual - target) / target > tolerance) {
      await safeDelete(key);
      throw new AppError(400, `Aspect ratio must be ${aw}:${ah}`);
    }
  }

  if (!rule.types.includes(`image/${meta.format}`)) {
    await safeDelete(key);
    throw new AppError(400, "Unsupported image format");
  }

  // 4. Write to DB — role-aware for avatar/cover, direct for the rest
  const oldKey = await commit(userId, slot, key, context);

  // 5. Delete the previous asset (fire and forget)
  if (oldKey && oldKey !== key) {
    safeDelete(oldKey);
  }

  return { key, url };
};

// ─── Reset to default ─────────────────────────────────────────
exports.reset = async ({ userId, slot, context }) => {
  const model = await targetModel(userId, slot, context);
  const map = FIELD_MAP[slot][model.constructor.name];
  if (!map) throw new AppError(400, "Cannot reset this slot");

  const oldKey = model[map.key];
  model[map.key] = null;
  if (map.flag) model[map.flag] = false;
  await model.save();

  if (oldKey) safeDelete(oldKey);
  return { reset: true };
};

// ─── Internals ────────────────────────────────────────────────
const FIELD_MAP = {
  avatar: {
    Profile:          { key: "profilePic",        flag: "hasCustomProfilePic" },
    Artist:           { key: "profilePictureUrl", flag: "hasCustomProfilePic" },
    CorporateProfile: { key: "logoUrl",           flag: "hasCustomLogo" },
  },
  cover: {
    Profile:          { key: "coverPhoto", flag: "hasCustomCoverPhoto" },
    Artist:           { key: "coverPhoto", flag: "hasCustomCoverPhoto" },
    CorporateProfile: { key: "coverPhoto", flag: "hasCustomCoverPhoto" },
  },
  album: { Album: { key: "cover_art", flag: "hasCustomCoverArt" } },
  plaque:{ Plaque:{ key: "plaqueImageUrl", flag: null } },
  news:  { News:  { key: "image", flag: null } },
};

async function targetModel(userId, slot, context) {
  if (slot === "album")  return Album.findByPk(context.albumId);
  if (slot === "plaque") return Plaque.findByPk(context.plaqueId);
  if (slot === "news")   return News.findByPk(context.newsId);

  if (slot === "avatar" || slot === "cover") {
    const role = context.role;
    if (role === "artist")    return Artist.findOne({ where: { userId } });
    if (role === "corporate") return CorporateProfile.findOne({ where: { userId } });
    return Profile.findOne({ where: { userId } });
  }
  return null;
}

async function commit(userId, slot, key, context) {
  const model = await targetModel(userId, slot, context);
  if (!model) throw new AppError(404, "Target record not found");

  const map = FIELD_MAP[slot][model.constructor.name];
  if (!map) throw new AppError(400, `Slot ${slot} not valid for this record`);

  // Ownership check for non-user-owned records
  if (slot === "album" && model.artistId !== context.artistId) {
    throw new AppError(403, "Not your album");
  }
  if (slot === "plaque" && model.ownerId !== userId) {
    throw new AppError(403, "Not your plaque");
  }

  const oldKey = model[map.key];
  model[map.key] = key;
  if (map.flag) model[map.flag] = true;
  await model.save();

  return oldKey;
}

async function safeDelete(key) {
  if (!key) return;
  try {
    await r2.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
    }));
  } catch (err) {
    console.error("R2 delete failed:", key, err.message);
  }
}

// Small helper the codebase will want
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
exports.AppError = AppError;