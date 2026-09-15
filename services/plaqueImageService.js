const CDN = process.env.MEDIA_CDN_BASE;

if (!CDN) {
  console.warn("⚠️  MEDIA_CDN_BASE not set — plaque images will fall back to the default placeholder");
}

// Tier slug → file name (lowercase)
const TIER_FILES = {
  SILVER:   "silver.png",
  GOLD:     "gold.png",
  SAPPHIRE: "sapphire.png",
  EMERALD:  "emerald.png",
  CRIMSON:  "crimson.png",
};

// Fallback for below-threshold contributions
const THANKYOU_FILE = "thankyou.png";

// The "Wood" tier — used when a plaque is manually downgraded, or for
// special recognition awards. Not part of the standard tier list, but
// the image exists, so expose it for admin grants.
const WOOD_FILE = "wood.png";

/**
 * Return the public URL for the given plaque tier.
 * Never returns null for a valid tier — always produces a URL.
 */
function plaqueImageUrl(plaqueType, { isThankYou = false, isWood = false } = {}) {
  if (isThankYou) return `${CDN}/plaques/${THANKYOU_FILE}`;
  if (isWood)      return `${CDN}/plaques/${WOOD_FILE}`;

  const file = TIER_FILES[String(plaqueType || "").toUpperCase()];
  return file ? `${CDN}/plaques/${file}` : `${CDN}/plaques/${THANKYOU_FILE}`;
}

module.exports = { plaqueImageUrl, TIER_FILES, THANKYOU_FILE, WOOD_FILE };