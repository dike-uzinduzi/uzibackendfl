const CDN_BASE =
  process.env.CDN_BASE ||
  "https://pub-969b935d3cad4df4a4e9c86a6c18588c.r2.dev";

const DEFAULT_PROFILE_PIC =
  process.env.DEFAULT_PROFILE_PIC_URL ||
  `${CDN_BASE}/placeholders/avatar-default.png`;

const DEFAULT_COVER_PHOTO =
  process.env.DEFAULT_COVER_PHOTO_URL ||
  `${CDN_BASE}/placeholders/cover-default.png`;

const DEFAULT_CORPORATE_LOGO =
  process.env.DEFAULT_CORPORATE_LOGO_URL ||
  `${CDN_BASE}/placeholders/logo-default.png`;

const DEFAULT_ALBUM_COVER =
  process.env.DEFAULT_ALBUM_COVER_URL ||
  `${CDN_BASE}/placeholders/album-cover-default.png`;

const DEFAULT_TRACK_ART =
  process.env.DEFAULT_TRACK_ART_URL ||
  `${CDN_BASE}/placeholders/track-art-default.png`;

const DEFAULT_PLAQUE_IMAGE =
  process.env.DEFAULT_PLAQUE_IMAGE_URL ||
  `${CDN_BASE}/placeholders/plaque-default.png`;

module.exports = {
  DEFAULT_PROFILE_PIC,
  DEFAULT_COVER_PHOTO,
  DEFAULT_CORPORATE_LOGO,
  DEFAULT_ALBUM_COVER,
  DEFAULT_TRACK_ART,
  DEFAULT_PLAQUE_IMAGE,
};