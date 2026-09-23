const SLOTS = {
  avatar: {
    prefix: "avatars",
    maxBytes: 5 * 1024 * 1024,
    minDim: 200,
    maxDim: 4000,
    aspect: null,
    types: ["image/jpeg", "image/png", "image/webp"],
  },
  cover: {
    prefix: "covers",
    maxBytes: 8 * 1024 * 1024,
    minDim: 1200,
    maxDim: 6000,
    aspect: [16, 9],
    aspectTolerance: 0.05,
    types: ["image/jpeg", "image/png", "image/webp"],
  },
  album: {
  prefix: "albums",
  maxBytes: 8 * 1024 * 1024,
  minDim: 1000,
  maxDim: 4000,
  aspect: null,          // ← was [1, 1]
  types: ["image/jpeg", "image/png", "image/webp"],
},
  plaque: {
    prefix: "plaques",
    maxBytes: 8 * 1024 * 1024,
    minDim: 600,
    maxDim: 4000,
    aspect: null,
    types: ["image/jpeg", "image/png", "image/webp"],
  },
  news: {
    prefix: "news",
    maxBytes: 8 * 1024 * 1024,
    minDim: 800,
    maxDim: 4000,
    aspect: null,
    types: ["image/jpeg", "image/png", "image/webp"],
  },
};

module.exports = { SLOTS };