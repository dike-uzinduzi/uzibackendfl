const express = require("express");
const axios = require("axios");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

const CDN_OWNER  = "dike-uzinduzi";
const CDN_REPO   = "image-cdn";
const CDN_BRANCH = "main";
const CDN_FOLDER = "images";
const CDN_BASE   = "https://dike-uzinduzi.github.io/image-cdn/images";

router.post("/image", authMiddleware, async (req, res) => {
  let { base64, filename } = req.body;

  if (!base64 || !filename) {
    return res.status(400).json({
      success: false,
      message: "base64 and filename are required"
    });
  }

  // 🔥 FIX 1: Remove data:image/... prefix if present
  if (base64.includes("base64,")) {
    base64 = base64.split("base64,")[1];
  }

  // 🔥 FIX 2: Validate base64 (basic check)
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(base64);
  if (!isBase64) {
    return res.status(400).json({
      success: false,
      message: "Invalid base64 string"
    });
  }

  // 🔥 FIX 3: Safe filename
  const safeName = `${Date.now()}_${filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase()}`;

  try {
    const response = await axios.put(
      `https://api.github.com/repos/${CDN_OWNER}/${CDN_REPO}/contents/${CDN_FOLDER}/${safeName}`,
      {
        message: `Upload ${safeName}`,
        content: base64,
        branch: CDN_BRANCH,
        committer: {
          name: "Uzinduzi Africa",
          email: "dike@uzinduziafrica.com",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_CDN_TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    // 🔥 FIX 4: Use GitHub response for accuracy
    const uploadedUrl = response.data?.content?.download_url;

    res.json({
      success: true,
      url: uploadedUrl || `${CDN_BASE}/${safeName}`,
    });

  } catch (error) {
    console.error(
      "GitHub CDN upload error:",
      JSON.stringify(error?.response?.data, null, 2)
    );

    res.status(error?.response?.status || 500).json({
      success: false,
      message:
        error?.response?.data?.message ||
        error.message ||
        "Upload failed",
    });
  }
});

module.exports = router;