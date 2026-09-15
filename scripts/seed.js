require("dotenv").config();
const {
  sequelize,
  User,
  Profile,
  Artist,
  CorporateProfile,
  Genre,
  Album,
  Track,
  AlbumGenre,
  AlbumLaunch
} = require("../models");
const SEED_PASSWORD = "Password123!";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
async function upsertUser({ userName, email, role, isEmailVerified = true }) {
  const [user] = await User.findOrCreate({
    where: { email },
    defaults: {
      userName,
      email,
      password: SEED_PASSWORD,
      role,
      isEmailVerified,
    },
  });
  return user;
}

async function upsertProfile(userId, data) {
  const [profile] = await Profile.findOrCreate({
    where: { userId },
    defaults: { userId, ...data },
  });
  return profile;
}

async function upsertArtist(userId, data) {
  const [artist] = await Artist.findOrCreate({
    where: { userId },
    defaults: { userId, ...data },
  });
  return artist;
}

async function upsertCorporate(userId, data) {
  const [corp] = await CorporateProfile.findOrCreate({
    where: { userId },
    defaults: { userId, ...data },
  });
  return corp;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function seed() {
     await sequelize.sync();  
  console.log("🌱 Seeding...\n");

  // ─── Admin ─────────────────────────────────────────────────
  const admin = await upsertUser({
    userName: "admin",
    email: "admin@uzinduziafrica.com",
    role: "admin",
  });
  await upsertProfile(admin.id, {
    firstName: "Platform",
    lastName: "Admin",
    contactEmail: admin.email,
  });
  console.log(`✅ Admin        → ${admin.email}  (${SEED_PASSWORD})`);

  // ─── Fan ───────────────────────────────────────────────────
  const fan = await upsertUser({
    userName: "fan",
    email: "fan@uzinduziafrica.com",
    role: "fan",
  });
  await upsertProfile(fan.id, {
    firstName: "Tendai",
    lastName: "Moyo",
    contactEmail: fan.email,
    phoneNumber: "+263771234567",
    countryOfResidence: "ZW",
  });
  console.log(`✅ Fan          → ${fan.email}  (${SEED_PASSWORD})`);

  // ─── Artist ────────────────────────────────────────────────
  const artistUser = await upsertUser({
    userName: "artist",
    email: "artist@uzinduziafrica.com",
    role: "artist",
  });
  await upsertProfile(artistUser.id, {
    firstName: "Dike",
    lastName: "Mahoko",
    contactEmail: artistUser.email,
    countryOfResidence: "ZW",
  });

  const genre = await Genre.findOrCreate({
    where: { name: "Afro Pop" },
    defaults: { name: "Afro Pop", description: "Contemporary African pop" },
  }).then(([g]) => g);

  const artist = await upsertArtist(artistUser.id, {
    name: "Dike Mahoko",
    stageName: "Dike",
    firstName: "Dike",
    lastName: "Mahoko",
    bio: "Zimbabwean Afro Pop artist. Seed data for development.",
    genreId: genre.id,
  });
  console.log(`✅ Artist       → ${artistUser.email}  (${SEED_PASSWORD})`);

  // ─── Corporate ─────────────────────────────────────────────
  const corpUser = await upsertUser({
    userName: "corporate",
    email: "corporate@uzinduziafrica.com",
    role: "corporate",
  });
  await upsertProfile(corpUser.id, {
    firstName: "Acme",
    lastName: "Corp",
    contactEmail: corpUser.email,
  });
  await upsertCorporate(corpUser.id, {
    companyName: "Acme Holdings",
    industry: "Telecommunications",
    csrFocus: "Youth & Music",
    officialEmail: "csr@acme.co.zw",
    companyBio: "Seed corporate sponsor.",
  });
  console.log(`✅ Corporate    → ${corpUser.email}  (${SEED_PASSWORD})`);

  // ─── Album + 9 tracks ──────────────────────────────────────
  console.log("\n🎵 Seeding album...");

  const albumTitle = "Rwendo Rwedu";
  const releaseDate = new Date();
  releaseDate.setDate(releaseDate.getDate() - 3);  // released 3 days ago

  const [album] = await Album.findOrCreate({
    where: { title: albumTitle, artistId: artist.id },
    defaults: {
      artistId: artist.id,
      title: albumTitle,
      release_date: releaseDate,
      albumType: "album",
      description: "A 9-track journey through modern Zimbabwean sound.",
      is_published: true,
    },
  });

  // Attach genre (skip if already attached)
  const [link] = await AlbumGenre.findOrCreate({
    where: { albumId: album.id, genreId: genre.id },
    defaults: { albumId: album.id, genreId: genre.id },
  });

  console.log(`   Album        → "${album.title}" (${album.id})`);

  // 9 tracks — 3:30 average
  const trackTitles = [
    "Intro: Rwendo",
    "Moyo Wangu",
    "Shamwari",
    "Usiku",
    "Nhasi",
    "Rudo",
    "Mwedzi",
    "Nzira",
    "Outro: Svondo",
  ];

  const DEFAULT_TRACK_MS = 3 * 60 * 1000 + 30 * 1000; // 3:30
  let createdTracks = 0;

  for (let i = 0; i < trackTitles.length; i++) {
    const [, wasCreated] = await Track.findOrCreate({
      where: { albumId: album.id, trackNumber: i + 1 },
      defaults: {
        albumId: album.id,
        title: trackTitles[i],
        durationMs: DEFAULT_TRACK_MS,
        trackNumber: i + 1,
        producer: "Dike",
        writer: "Dike Mahoko",
        performedBy: "Dike",
        isPublished: true,
        releaseDate,
      },
    });
    if (wasCreated) createdTracks++;
  }

// Schedule a launch: 3 days before the physical launch, 7 days after.
// Physical launch is 3 days from now, so:
//   startsAt = now + 0 days  (launch opens today for demo purposes)
//   endsAt   = now + 10 days
const adminUser = await User.findOne({ where: { role: "admin" } });

if (adminUser) {
  const physicalLaunchAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const startsAt = new Date(physicalLaunchAt.getTime() - 3 * 24 * 60 * 60 * 1000);
  const endsAt   = new Date(physicalLaunchAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [launch] = await AlbumLaunch.findOrCreate({
    where: { albumId: album.id },
    defaults: {
      albumId: album.id,
      startsAt,
      endsAt,
      physicalLaunchAt,
      status: "active",       // active for demo — bidding can happen now
      createdBy: adminUser.id,
      tierThresholds: [
        { tier: "SILVER",   minAmount: 51   },
        { tier: "GOLD",     minAmount: 150  },
        { tier: "SAPPHIRE", minAmount: 300  },
        { tier: "EMERALD",  minAmount: 600  },
        { tier: "CRIMSON",  minAmount: 1000 },
      ],
    },
  });

  console.log(`   Launch       → active (${launch.startsAt.toISOString().slice(0,10)} → ${launch.endsAt.toISOString().slice(0,10)})`);
}
  // Recompute album counters from actual tracks
  const tracks = await Track.findAll({ where: { albumId: album.id } });
  const totalMs = tracks.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  album.track_count = tracks.length;
  album.duration = Math.round(totalMs / 1000);  // seconds
  await album.save();

  console.log(`   Tracks       → ${tracks.length} total (${createdTracks} newly created)`);
  console.log(`   Duration     → ${Math.floor(album.duration / 60)}m ${album.duration % 60}s`);

  // ─── Summary ───────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────");
  console.log("✅ Seed complete.\n");
  console.log("Login credentials (all use the same password):\n");
  console.log(`   Admin       admin@uzinduziafrica.com`);
  console.log(`   Fan         fan@uzinduziafrica.com`);
  console.log(`   Artist      artist@uzinduziafrica.com`);
  console.log(`   Corporate   corporate@uzinduziafrica.com`);
  console.log(`\n   Password    ${SEED_PASSWORD}\n`);
  console.log("─────────────────────────────────────────");
}

seed()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("\n❌ Seed failed:", err);
    await sequelize.close();
    process.exit(1);
  });