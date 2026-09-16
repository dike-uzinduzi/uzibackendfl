const sequelize = require("../config/database");

const User             = require("./User");
const Profile          = require("./Profile");
const Artist           = require("./Artist");
const CorporateProfile = require("./CorporateProfile");
const PlaqueTier = require("./PlaqueTier");
const AlbumLike = require("./AlbumLike");
const OtpToken     = require("./OtpToken");
const RefreshToken = require("./RefreshToken");

const Genre       = require("./Genre");
const Album       = require("./Album");
const AlbumLaunch = require("./AlbumLaunch");
const AlbumGenre  = require("./AlbumGenre");
const Track       = require("./Track");
const AlbumView   = require("./AlbumView");
const TrackLike   = require("./TrackLike");
const ArtistFollow = require("./ArtistFollow");
const FanActivity = require("./FanActivity");

const Payment          = require("./Payment");
const Plaque           = require("./Plaque");
const CorporateSupport = require("./CorporateSupport");

const News = require("./News");

// ─── Identity & Auth ────────────────────────────────────────
User.hasOne(Profile, {
  foreignKey: "userId",
  as: "profile",              // ← ADDED alias
  onDelete: "CASCADE",
});
Profile.belongsTo(User, { foreignKey: "userId" });

User.hasOne(Artist, { foreignKey: "userId", onDelete: "CASCADE" });
Artist.belongsTo(User, { foreignKey: "userId" });

User.hasOne(CorporateProfile, {
  foreignKey: "userId",
  as: "corporateProfile",
  onDelete: "CASCADE",
});
CorporateProfile.belongsTo(User, { foreignKey: "userId" });

User.hasMany(RefreshToken, { foreignKey: "userId", onDelete: "CASCADE" });
RefreshToken.belongsTo(User, { foreignKey: "userId" });

// ─── Music graph ────────────────────────────────────────────
Genre.hasMany(Artist, { foreignKey: "genreId", onDelete: "SET NULL" });
Artist.belongsTo(Genre, { foreignKey: "genreId" });

Artist.hasMany(Album, {
  foreignKey: "artistId",
  as: "albums",               // ← ADDED alias (so Album↔Artist both directions are named)
  onDelete: "CASCADE",
});
Album.belongsTo(Artist, {
  foreignKey: "artistId",
  as: "artist",               // ← ADDED alias (payment code reads album.artist)
});

Album.belongsToMany(Genre, {
  through: AlbumGenre,
  foreignKey: "albumId",
  otherKey: "genreId",
  as: "Genres",
});
Genre.belongsToMany(Album, {
  through: AlbumGenre,
  foreignKey: "genreId",
  otherKey: "albumId",
  as: "Albums",
});

Album.hasMany(Track, { foreignKey: "albumId", onDelete: "CASCADE" });
Track.belongsTo(Album, { foreignKey: "albumId" });

// ─── Launch ─────────────────────────────────────────────────
Album.hasOne(AlbumLaunch, {
  foreignKey: "albumId",
  as: "launch",
  onDelete: "CASCADE",
});
AlbumLaunch.belongsTo(Album, { foreignKey: "albumId", as: "album" });

User.hasMany(AlbumLaunch, { foreignKey: "createdBy", onDelete: "RESTRICT" });
AlbumLaunch.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// ─── Commerce ───────────────────────────────────────────────
User.hasMany(Payment, { foreignKey: "userId", onDelete: "SET NULL" });
Payment.belongsTo(User, { foreignKey: "userId" });

Album.hasMany(Payment, { foreignKey: "albumId", onDelete: "SET NULL" });
Payment.belongsTo(Album, { foreignKey: "albumId" });

Payment.hasOne(Plaque, { foreignKey: "paymentId", onDelete: "RESTRICT" });
Plaque.belongsTo(Payment, {
  foreignKey: "paymentId",
  as: "plaquePayment",        // ← ADDED alias
});

User.hasMany(Plaque, { foreignKey: "ownerId", as: "plaques", onDelete: "RESTRICT" });
Plaque.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

Album.hasMany(Plaque, {
  foreignKey: "albumId",
  as: "plaques",              // ← ADDED alias for symmetry
  onDelete: "RESTRICT",
});
Plaque.belongsTo(Album, {
  foreignKey: "albumId",
  as: "plaqueAlbum",          // ← ADDED alias
});

Artist.hasMany(Plaque, { foreignKey: "artistId", onDelete: "RESTRICT" });
Plaque.belongsTo(Artist, { foreignKey: "artistId" });

// ─── Corporate ──────────────────────────────────────────────
CorporateProfile.hasMany(CorporateSupport, {
  foreignKey: "corporateId",
  onDelete: "CASCADE",
});
CorporateSupport.belongsTo(CorporateProfile, { foreignKey: "corporateId" });

Artist.hasMany(CorporateSupport, { foreignKey: "artistId", onDelete: "SET NULL" });
CorporateSupport.belongsTo(Artist, { foreignKey: "artistId" });

// ─── Engagement ─────────────────────────────────────────────
User.hasMany(ArtistFollow, { foreignKey: "userId", onDelete: "CASCADE" });
ArtistFollow.belongsTo(User, { foreignKey: "userId" });

Artist.hasMany(ArtistFollow, { foreignKey: "artistId", onDelete: "CASCADE" });
ArtistFollow.belongsTo(Artist, { foreignKey: "artistId" });

User.hasMany(TrackLike, { foreignKey: "userId", onDelete: "CASCADE" });
TrackLike.belongsTo(User, { foreignKey: "userId" });

Track.hasMany(TrackLike, { foreignKey: "trackId", onDelete: "CASCADE" });
TrackLike.belongsTo(Track, { foreignKey: "trackId" });

User.hasMany(AlbumView, { foreignKey: "userId", onDelete: "SET NULL" });
AlbumView.belongsTo(User, { foreignKey: "userId" });

Album.hasMany(AlbumView, { foreignKey: "albumId", onDelete: "CASCADE" });
AlbumView.belongsTo(Album, { foreignKey: "albumId" });

User.hasMany(FanActivity, { foreignKey: "userId", onDelete: "CASCADE" });
FanActivity.belongsTo(User, { foreignKey: "userId" });

Artist.hasMany(FanActivity, { foreignKey: "artistId", onDelete: "SET NULL" });
FanActivity.belongsTo(Artist, { foreignKey: "artistId" });

// ─── Content ────────────────────────────────────────────────
User.hasMany(News, { foreignKey: "authorId", onDelete: "SET NULL" });
News.belongsTo(User, { foreignKey: "authorId", as: "author" });

// ────────────────────────────────────────────────────────────
// Album <-> AlbumLike
User.hasMany(AlbumLike, { foreignKey: "userId", onDelete: "CASCADE" });
AlbumLike.belongsTo(User, { foreignKey: "userId" });

Album.hasMany(AlbumLike, { foreignKey: "albumId", onDelete: "CASCADE" });
AlbumLike.belongsTo(Album, { foreignKey: "albumId" });

// PlaqueTier is standalone — referenced by slug only, no FK
module.exports = {
  sequelize,
  User, Profile, Artist, CorporateProfile,
  OtpToken, RefreshToken,
  Genre, Album, AlbumLaunch, AlbumGenre, Track, AlbumView, TrackLike, ArtistFollow, FanActivity,
  Payment, Plaque, CorporateSupport,
  News, PlaqueTier, AlbumLike
};