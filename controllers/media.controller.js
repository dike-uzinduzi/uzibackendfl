const media = require("../services/media.service");
const Artist = require("../models/Artist");

async function resolveContext(req) {
  const ctx = {
    role: req.user.role,
    artistId: null,
  };

  // Only artists need an artistId, and only for the album/avatar/cover slots
  if (req.user.role === "artist") {
    const artist = await Artist.findOne({
      where: { userId: req.user.id },
      attributes: ["id"],
    });
    ctx.artistId = artist?.id || null;
  }

  return ctx;
}

exports.presign = async (req, res, next) => {
  try {
    const { slot } = req.params;
    const { contentType, contentLength } = req.body;

    const result = await media.presign({
      userId: req.user.id,
      slot,
      contentType,
      contentLength,
    });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.confirm = async (req, res, next) => {
  try {
    const { slot } = req.params;
    const { key, ...context } = req.body;

    const result = await media.confirm({
      userId: req.user.id,
      slot,
      key,
      context: { ...context, ...(await resolveContext(req)) },
    });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.reset = async (req, res, next) => {
  try {
    const { slot } = req.params;

    const result = await media.reset({
      userId: req.user.id,
      slot,
      context: { ...req.body, ...(await resolveContext(req)) },
    });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};