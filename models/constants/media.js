const DEFAULT_PROFILE_PIC =
  process.env.DEFAULT_PROFILE_PIC_URL ||
  "https://app.uzinduziafrica.com/placeholders/avatar-default.png";

const DEFAULT_COVER_PHOTO =
  process.env.DEFAULT_COVER_PHOTO_URL ||
  "https://app.uzinduziafrica.com/placeholders/cover-default.jpg";

const DEFAULT_CORPORATE_LOGO =
  process.env.DEFAULT_CORPORATE_LOGO_URL ||
  "https://app.uzinduziafrica.com/placeholders/logo-default.png";

const DEFAULT_ALBUM_COVER =
  process.env.DEFAULT_ALBUM_COVER_URL ||
  "https://app.uzinduziafrica.com/placeholders/album-cover-default.jpg";

const DEFAULT_TRACK_ART =
  process.env.DEFAULT_TRACK_ART_URL ||
  "https://app.uzinduziafrica.com/placeholders/track-art-default.jpg";

const DEFAULT_PLAQUE_IMAGE =
  process.env.DEFAULT_PLAQUE_IMAGE_URL ||
  "https://app.uzinduziafrica.com/placeholders/plaque-default.png";

module.exports = {
  DEFAULT_PROFILE_PIC,
  DEFAULT_COVER_PHOTO,
  DEFAULT_CORPORATE_LOGO,
  DEFAULT_ALBUM_COVER,
  DEFAULT_TRACK_ART,
  DEFAULT_PLAQUE_IMAGE,
};