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
    const { key, ...bodyContext } = req.body;

    const base = await resolveContext(req);

    // Body context wins when it explicitly provides a value;
    // resolveContext fills the rest. role is always forced to the
    // authenticated user's real role — never trust body.role.
    const context = {
      ...base,
      ...bodyContext,
      role: req.user.role,
    };

    const result = await media.confirm({
      userId: req.user.id,
      slot,
      key,
      context,
    });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.reset = async (req, res, next) => {
  try {
    const { slot } = req.params;

    const base = await resolveContext(req);

    const context = {
      ...base,
      ...req.body,
      role: req.user.role,
    };

    const result = await media.reset({
      userId: req.user.id,
      slot,
      context,
    });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};