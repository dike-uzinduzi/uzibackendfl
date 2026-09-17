require("dotenv").config();
const {
  sequelize,
  User, Profile, Artist, Genre,
  Album, AlbumLaunch, AlbumGenre, Track,
} = require("../models");

const PASSWORD = "DemoPass123!";

const CDN = process.env.MEDIA_CDN_BASE || "https://pub-969b935d3cad4df4a4e9c86a6c18588c.r2.dev";
const PLACEHOLDER_AVATAR = `${CDN}/placeholders/avatar-default.png`;
const PLACEHOLDER_COVER  = `${CDN}/placeholders/cover-default.png`;
const PLACEHOLDER_ALBUM  = `${CDN}/placeholders/album-cover-default.png`;
const PLACEHOLDER_TRACK  = `${CDN}/placeholders/track-art-default.png`;

const FANS = [
  {
    userName: "demofan1",
    email: "demofan1@uzinduziafrica.com",
    firstName: "Rudo",
    lastName: "Chirwa",
    phone: "+263771111111",
    whatsapp: "+263771111111",
    country: "Zimbabwe",
    address: "12 Samora Machel Ave, Harare",
    bio: "Afro-pop superfan. Collecting plaques since day one.",
    dob: "1996-04-12",
    gender: "female",
  },
  {
    userName: "demofan2",
    email: "demofan2@uzinduziafrica.com",
    firstName: "Tanaka",
    lastName: "Ncube",
    phone: "+263771111112",
    whatsapp: "+263771111112",
    country: "Zimbabwe",
    address: "45 Fife Street, Bulawayo",
    bio: "Hip-hop head. Zimbabwean artists deserve the world.",
    dob: "1994-09-30",
    gender: "male",
  },
  {
    userName: "demofan3",
    email: "demofan3@uzinduziafrica.com",
    firstName: "Nyasha",
    lastName: "Mutasa",
    phone: "+263771111113",
    whatsapp: "+263771111113",
    country: "Zimbabwe",
    address: "8 Josiah Tongogara, Mutare",
    bio: "Amapiano on repeat. Supporting local since 2019.",
    dob: "1998-01-22",
    gender: "female",
  },
  {
    userName: "demofan4",
    email: "demofan4@uzinduziafrica.com",
    firstName: "Farai",
    lastName: "Zhou",
    phone: "+263771111114",
    whatsapp: "+263771111114",
    country: "Zimbabwe",
    address: "3 Robert Mugabe Way, Gweru",
    bio: "Producer in training. Here for the culture.",
    dob: "1992-11-08",
    gender: "male",
  },
];

const ARTISTS = [
  {
    userName: "demoartist1",
    email: "demoartist1@uzinduziafrica.com",
    stageName: "Soko",
    firstName: "Tendai",
    lastName: "Moyo",
    genre: "Afro Pop",
    bio: "Rising Afro Pop voice from Harare. Blending marimba with modern synths.",
    phone: "+263772222001",
    country: "Zimbabwe",
  },
  {
    userName: "demoartist2",
    email: "demoartist2@uzinduziafrica.com",
    stageName: "Mhofu",
    firstName: "Blessing",
    lastName: "Ndlovu",
    genre: "Hip Hop",
    bio: "Hip-hop storyteller from Bulawayo. Bars about the streets, the people, the future.",
    phone: "+263772222002",
    country: "Zimbabwe",
  },
  {
    userName: "demoartist3",
    email: "demoartist3@uzinduziafrica.com",
    stageName: "Gwenzi",
    firstName: "Rutendo",
    lastName: "Chikafu",
    genre: "Afro Soul",
    bio: "Soulful melodies rooted in tradition. Voice like warm honey.",
    phone: "+263772222003",
    country: "Zimbabwe",
  },
  {
    userName: "demoartist4",
    email: "demoartist4@uzinduziafrica.com",
    stageName: "Nzou",
    firstName: "Kudakwashe",
    lastName: "Sibanda",
    genre: "Amapiano",
    bio: "Amapiano beats with a Zimbabwean twist. Log drums and love.",
    phone: "+263772222004",
    country: "Zimbabwe",
  },
];

const DEMO_ALBUM_TITLE = "Demo Album — Uzinduzi Showcase";
const RELEASE_OFFSET_MS = -2 * 24 * 60 * 60 * 1000; // 2 days ago

const TRACKS = [
  {
    title: "Kutanga",
    featuredArtists: "Soko, Gwenzi",
    writer: "Soko",
    producer: "Mhofu",
    performedBy: "Soko",
    backingVocals: "Gwenzi",
    instrumentation: "Marimba, Bass, Drums",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "An opening invocation blending traditional marimba with modern synths.",
    specialCredits: "Recorded at Uzinduzi Studios, Harare",
    durationMs: 3 * 60 * 1000 + 15 * 1000,
    likeCount: 42,
  },
  {
    title: "Moyo Wangu",
    featuredArtists: null,
    writer: "Soko, Gwenzi",
    producer: "Mhofu",
    performedBy: "Soko",
    backingVocals: "Gwenzi, Nzou",
    instrumentation: "Guitar, Bass, Piano",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "A love song about courage and giving your heart fully.",
    specialCredits: "Strings arranged by R. Chikafu",
    durationMs: 3 * 60 * 1000 + 42 * 1000,
    likeCount: 78,
  },
  {
    title: "Shamwari",
    featuredArtists: "Mhofu",
    writer: "Soko, Mhofu",
    producer: "Mhofu",
    performedBy: "Soko, Mhofu",
    backingVocals: "Gwenzi",
    instrumentation: "Bass, Drums, Synth",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "An ode to friendship — the ones who show up.",
    specialCredits: "Recorded at Uzinduzi Studios, Harare",
    durationMs: 4 * 60 * 1000 + 5 * 1000,
    likeCount: 63,
  },
  {
    title: "Usiku",
    featuredArtists: null,
    writer: "Soko",
    producer: "Gwenzi",
    performedBy: "Soko",
    backingVocals: "Gwenzi",
    instrumentation: "Piano, Strings",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "Night-time reflections. Slow burn.",
    specialCredits: "Piano recorded at Shed Studios",
    durationMs: 3 * 60 * 1000 + 58 * 1000,
    likeCount: 55,
  },
  {
    title: "Nhasi",
    featuredArtists: "Nzou",
    writer: "Soko, Nzou",
    producer: "Nzou",
    performedBy: "Soko, Nzou",
    backingVocals: null,
    instrumentation: "Log drum, Bass, Horns",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "Amapiano crossover. Today is the day.",
    specialCredits: "Additional production by K. Sibanda",
    durationMs: 4 * 60 * 1000 + 22 * 1000,
    likeCount: 121,
  },
  {
    title: "Rudo",
    featuredArtists: "Gwenzi",
    writer: "Soko, Gwenzi",
    producer: "Gwenzi",
    performedBy: "Soko, Gwenzi",
    backingVocals: "Gwenzi",
    instrumentation: "Acoustic Guitar, Cello",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "A duet about love that endures.",
    specialCredits: "Cello by T. Mutasa",
    durationMs: 3 * 60 * 1000 + 33 * 1000,
    likeCount: 94,
  },
  {
    title: "Mwedzi",
    featuredArtists: null,
    writer: "Soko",
    producer: "Mhofu",
    performedBy: "Soko",
    backingVocals: "Gwenzi",
    instrumentation: "Kalimba, Bass, Percussion",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "Moonlight, silence, and the pull of home.",
    specialCredits: "Kalimba performed by Soko",
    durationMs: 3 * 60 * 1000 + 12 * 1000,
    likeCount: 71,
  },
  {
    title: "Nzira",
    featuredArtists: "Mhofu, Nzou",
    writer: "Soko, Mhofu, Nzou",
    producer: "Mhofu",
    performedBy: "Soko, Mhofu, Nzou",
    backingVocals: "Gwenzi",
    instrumentation: "Bass, Drums, Synth, Horns",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "The road. Choices. Perseverance.",
    specialCredits: "Brass section arranged by K. Sibanda",
    durationMs: 4 * 60 * 1000 + 48 * 1000,
    likeCount: 156,
  },
  {
    title: "Svondo",
    featuredArtists: null,
    writer: "Soko, Gwenzi",
    producer: "Gwenzi",
    performedBy: "Soko",
    backingVocals: "Gwenzi, Nzou, Mhofu",
    instrumentation: "Choir, Piano, Strings",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "A closing hymn. Gratitude. Sunday morning.",
    specialCredits: "Choir recorded at St Mary's Cathedral",
    durationMs: 5 * 60 * 1000 + 10 * 1000,
    likeCount: 203,
  },
];

async function seed() {
  await sequelize.sync();
  console.log("🌱 Seeding demo accounts with full data...\n");

  // ─── Admin (for launch createdBy) ─────────────────────────
  const admin = await User.findOne({
    where: {
      role: ["admin", "super_admin"],
    },
  });
  if (!admin) {
    console.warn("⚠️  No admin or super_admin user found.");
    console.warn("    Add SUPER_ADMIN_EMAIL and SUPER_ADMIN_DEFAULT_PASSWORD to .env");
    console.warn("    and restart the backend, or run `node scripts/seed.js` first.");
    process.exit(1);
  }
  console.log(`Using admin: ${admin.email} (${admin.role})`);

  // ─── Fans ─────────────────────────────────────────────────
  for (const f of FANS) {
    const [user] = await User.findOrCreate({
      where: { email: f.email },
      defaults: {
        userName: f.userName,
        email: f.email,
        password: PASSWORD,
        role: "fan",
        isEmailVerified: true,
        isDemoAccount: true,
      },
    });
    if (!user.isDemoAccount) {
      user.isDemoAccount = true;
      await user.save();
    }

    await Profile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        firstName: f.firstName,
        lastName: f.lastName,
        contactEmail: f.email,
        phoneNumber: f.phone,
        whatsappNumber: f.whatsapp,
        countryOfResidence: f.country,
        address: f.address,
        bio: f.bio,
        dateOfBirth: f.dob,
        gender: f.gender,
        profilePic: PLACEHOLDER_AVATAR,
        coverPhoto: PLACEHOLDER_COVER,
        hasCustomProfilePic: false,
        hasCustomCoverPhoto: false,
      },
    });

    console.log(`✅ Demo Fan     → ${f.email}  (${f.firstName} ${f.lastName})`);
  }

  // ─── Artists ──────────────────────────────────────────────
  const createdArtists = [];
  for (const a of ARTISTS) {
    const [genre] = await Genre.findOrCreate({
      where: { name: a.genre },
      defaults: { name: a.genre, description: `${a.genre} — demo genre` },
    });

    const [user] = await User.findOrCreate({
      where: { email: a.email },
      defaults: {
        userName: a.userName,
        email: a.email,
        password: PASSWORD,
        role: "artist",
        isEmailVerified: true,
        isDemoAccount: true,
      },
    });
    if (!user.isDemoAccount) {
      user.isDemoAccount = true;
      await user.save();
    }

    await Profile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        firstName: a.firstName,
        lastName: a.lastName,
        contactEmail: a.email,
        phoneNumber: a.phone,
        whatsappNumber: a.phone,
        countryOfResidence: a.country,
        bio: a.bio,
        profilePic: PLACEHOLDER_AVATAR,
        coverPhoto: PLACEHOLDER_COVER,
        hasCustomProfilePic: false,
        hasCustomCoverPhoto: false,
      },
    });

    const [artist] = await Artist.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        name: a.stageName,
        stageName: a.stageName,
        firstName: a.firstName,
        lastName: a.lastName,
        bio: a.bio,
        genreId: genre.id,
        canCreateAlbums: true,
        profilePictureUrl: PLACEHOLDER_AVATAR,
        coverPhoto: PLACEHOLDER_COVER,
        hasCustomProfilePic: false,
        hasCustomCoverPhoto: false,
      },
    });
    if (!artist.canCreateAlbums) {
      artist.canCreateAlbums = true;
      await artist.save();
    }

    createdArtists.push(artist);
    console.log(`✅ Demo Artist  → ${a.email}  (stage: ${a.stageName}, genre: ${a.genre})`);
  }

  // ─── Demo album with every attribute ──────────────────────
  const releaseDate = new Date(Date.now() + RELEASE_OFFSET_MS);

  const [album] = await Album.findOrCreate({
    where: { title: DEMO_ALBUM_TITLE, artistId: createdArtists[0].id },
    defaults: {
      artistId: createdArtists[0].id,
      title: DEMO_ALBUM_TITLE,
      release_date: releaseDate,
      albumType: "album",
      cover_art: PLACEHOLDER_ALBUM,
      hasCustomCoverArt: false,
      description:
        "A nine-track showcase album built for demonstrating the Uzinduzi " +
        "support-and-plaque flow. Fully populated with credits, features, " +
        "and production metadata.",
      copyright_info: `© ${new Date().getFullYear()} Uzinduzi Demo Recordings`,
      publisher: "Uzinduzi Demo Publishing",
      credits:
        "All songs written and performed by Soko. Produced by Mhofu and Gwenzi. " +
        "Recorded at Uzinduzi Studios, Harare. Mixed and mastered by T. Ncube and K. Moyo. " +
        "Artwork by Uzinduzi Creative.",
      affiliation: "ZIMRA / ZIMCOPY",
      is_published: true,
      is_featured: true,
      isDemo: true,
      is_deleted: false,
      viewCount: 0,
      track_count: TRACKS.length,
      duration: Math.round(
        TRACKS.reduce((sum, t) => sum + t.durationMs, 0) / 1000,
      ),
    },
  });

  // Backfill fields on re-run
  album.description = album.description || "A nine-track showcase album...";
  album.copyright_info = album.copyright_info || `© ${new Date().getFullYear()} Uzinduzi Demo Recordings`;
  album.publisher = album.publisher || "Uzinduzi Demo Publishing";
  album.affiliation = album.affiliation || "ZIMRA / ZIMCOPY";
  album.credits = album.credits || "Recorded at Uzinduzi Studios, Harare.";
  album.cover_art = album.cover_art || PLACEHOLDER_ALBUM;
  album.isDemo = true;
  album.is_featured = true;
  album.is_published = true;
  await album.save();

  // ─── Genres (many-to-many) ────────────────────────────────
  const albumGenres = ["Afro Pop", "Afro Soul", "Amapiano"];
  for (const gName of albumGenres) {
    const [g] = await Genre.findOrCreate({
      where: { name: gName },
      defaults: { name: gName, description: `${gName} — demo genre` },
    });
    await AlbumGenre.findOrCreate({
      where: { albumId: album.id, genreId: g.id },
      defaults: { albumId: album.id, genreId: g.id },
    });
  }

  // ─── Nine full-attribute tracks ───────────────────────────
  let createdTracks = 0;
  for (let i = 0; i < TRACKS.length; i++) {
    const t = TRACKS[i];
    const [_, wasCreated] = await Track.findOrCreate({
      where: { albumId: album.id, trackNumber: i + 1 },
      defaults: {
        albumId: album.id,
        title: t.title,
        durationMs: t.durationMs,
        trackNumber: i + 1,
        featuredArtists: t.featuredArtists,
        trackArt: PLACEHOLDER_TRACK,
        hasCustomTrackArt: false,
        trackDescription: t.trackDescription,
        writer: t.writer,
        performedBy: t.performedBy,
        specialCredits: t.specialCredits,
        backingVocals: t.backingVocals,
        instrumentation: t.instrumentation,
        releaseDate,
        producer: t.producer,
        masteringEngineer: t.masteringEngineer,
        mixingEngineer: t.mixingEngineer,
        likeCount: t.likeCount,
        isPublished: true,
        isDeleted: false,
      },
    });
    if (wasCreated) createdTracks++;
  }

  // Recompute album counters from actual tracks
  const tracks = await Track.findAll({ where: { albumId: album.id } });
  const totalMs = tracks.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  album.track_count = tracks.length;
  album.duration = Math.round(totalMs / 1000);
  await album.save();

  // ─── Launch — active now, ends in 30 days ─────────────────
  const startsAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const endsAt   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const physicalLaunchAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const [launch] = await AlbumLaunch.findOrCreate({
    where: { albumId: album.id },
    defaults: {
      albumId: album.id,
      startsAt,
      endsAt,
      physicalLaunchAt,
      status: "active",
      createdBy: admin.id,
      tierThresholds: [
        { tier: "SILVER",   minAmount: 51   },
        { tier: "GOLD",     minAmount: 150  },
        { tier: "SAPPHIRE", minAmount: 300  },
        { tier: "EMERALD",  minAmount: 600  },
        { tier: "CRIMSON",  minAmount: 1000 },
      ],
    },
  });

  // Keep launch active on re-run
  if (launch.status !== "active" || new Date(launch.endsAt) < new Date()) {
    launch.startsAt = startsAt;
    launch.endsAt = endsAt;
    launch.status = "active";
    await launch.save();
  }

  // ─── Summary ──────────────────────────────────────────────
  console.log(`\n🎵 Demo album   → "${album.title}"`);
  console.log(`   Album ID     → ${album.id}`);
  console.log(`   Tracks       → ${tracks.length} (${createdTracks} newly created)`);
  console.log(`   Duration     → ${Math.floor(album.duration / 60)}m ${album.duration % 60}s`);
  console.log(`   Genres       → ${albumGenres.join(", ")}`);
  console.log(`   Launch       → active until ${launch.endsAt.toISOString().slice(0, 10)}`);

  console.log("\n─────────────────────────────────────────");
  console.log("Demo logins (same password for all):");
  console.log(`   ${PASSWORD}\n`);
  console.log("   Fans:");
  FANS.forEach(f => console.log(`     ${f.email}`));
  console.log("\n   Artists:");
  ARTISTS.forEach(a => console.log(`     ${a.email}`));
  console.log("\n   Album ID:");
  console.log(`     ${album.id}`);
  console.log("─────────────────────────────────────────\n");
}

seed()
  .then(async () => { await sequelize.close(); process.exit(0); })
  .catch(async (err) => {
    console.error("\n❌ Seed failed:", err);
    await sequelize.close();
    process.exit(1);
  });