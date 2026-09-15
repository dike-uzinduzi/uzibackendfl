require("dotenv").config();
const {
  sequelize,
  User, Profile, Artist, Genre,
  Album, AlbumLaunch, AlbumGenre, Track,
} = require("../models");

const PASSWORD = "DemoPass123!";

const FANS = [
  { userName: "demofan1", email: "demofan1@uzinduziafrica.com", firstName: "Rudo",   lastName: "Chirwa",  phone: "+263771111111" },
  { userName: "demofan2", email: "demofan2@uzinduziafrica.com", firstName: "Tanaka", lastName: "Ncube",   phone: "+263771111112" },
  { userName: "demofan3", email: "demofan3@uzinduziafrica.com", firstName: "Nyasha", lastName: "Mutasa",  phone: "+263771111113" },
  { userName: "demofan4", email: "demofan4@uzinduziafrica.com", firstName: "Farai",  lastName: "Zhou",    phone: "+263771111114" },
];

const ARTISTS = [
  { userName: "demoartist1", email: "demoartist1@uzinduziafrica.com", stageName: "Soko",   genre: "Afro Pop",  bio: "Rising Afro Pop voice from Harare." },
  { userName: "demoartist2", email: "demoartist2@uzinduziafrica.com", stageName: "Mhofu",  genre: "Hip Hop",   bio: "Hip-hop storyteller from Bulawayo." },
  { userName: "demoartist3", email: "demoartist3@uzinduziafrica.com", stageName: "Gwenzi", genre: "Afro Soul", bio: "Soulful melodies rooted in tradition." },
  { userName: "demoartist4", email: "demoartist4@uzinduziafrica.com", stageName: "Nzou",   genre: "Amapiano",  bio: "Amapiano beats with a Zimbabwean twist." },
];

const DEMO_ALBUM_TITLE = "Demo Album — Uzinduzi Showcase";

// Nine full-attribute tracks
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
    durationMs: 3 * 60 * 1000 + 15 * 1000,   // 3:15
  },
  {
    title: "Moyo Wangu",
    featuredArtists: "",
    writer: "Soko, Gwenzi",
    producer: "Mhofu",
    performedBy: "Soko",
    backingVocals: "Gwenzi, Nzou",
    instrumentation: "Guitar, Bass, Piano",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "A love song about courage and giving your heart fully.",
    durationMs: 3 * 60 * 1000 + 42 * 1000,   // 3:42
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
    durationMs: 4 * 60 * 1000 + 5 * 1000,    // 4:05
  },
  {
    title: "Usiku",
    featuredArtists: "",
    writer: "Soko",
    producer: "Gwenzi",
    performedBy: "Soko",
    backingVocals: "Gwenzi",
    instrumentation: "Piano, Strings",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "Night-time reflections. Slow burn.",
    durationMs: 3 * 60 * 1000 + 58 * 1000,   // 3:58
  },
  {
    title: "Nhasi",
    featuredArtists: "Nzou",
    writer: "Soko, Nzou",
    producer: "Nzou",
    performedBy: "Soko, Nzou",
    backingVocals: "",
    instrumentation: "Log drum, Bass, Horns",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "Amapiano crossover. Today is the day.",
    durationMs: 4 * 60 * 1000 + 22 * 1000,   // 4:22
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
    durationMs: 3 * 60 * 1000 + 33 * 1000,   // 3:33
  },
  {
    title: "Mwedzi",
    featuredArtists: "",
    writer: "Soko",
    producer: "Mhofu",
    performedBy: "Soko",
    backingVocals: "Gwenzi",
    instrumentation: "Kalimba, Bass, Percussion",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "Moonlight, silence, and the pull of home.",
    durationMs: 3 * 60 * 1000 + 12 * 1000,   // 3:12
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
    durationMs: 4 * 60 * 1000 + 48 * 1000,   // 4:48
  },
  {
    title: "Svondo",
    featuredArtists: "",
    writer: "Soko, Gwenzi",
    producer: "Gwenzi",
    performedBy: "Soko",
    backingVocals: "Gwenzi, Nzou, Mhofu",
    instrumentation: "Choir, Piano, Strings",
    masteringEngineer: "T. Ncube",
    mixingEngineer: "K. Moyo",
    trackDescription: "A closing hymn. Gratitude. Sunday morning.",
    durationMs: 5 * 60 * 1000 + 10 * 1000,   // 5:10
  },
];

async function seed() {
  await sequelize.sync();
  console.log("🌱 Seeding demo accounts...\n");

  // ─── Admin (for launch createdBy) ─────────────────────────
  const admin = await User.findOne({ where: { role: "admin" } });
  if (!admin) {
    console.warn("⚠️  No admin user found. Run `node scripts/seed.js` first.");
    process.exit(1);
  }

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
        whatsappNumber: f.phone,
        countryOfResidence: "ZW",
        address: "Harare, Zimbabwe",
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
        firstName: a.stageName,
        lastName: "Demo",
        contactEmail: a.email,
        countryOfResidence: "ZW",
      },
    });

    const [artist] = await Artist.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        name: a.stageName,
        stageName: a.stageName,
        firstName: a.stageName,
        lastName: "Demo",
        bio: a.bio,
        genreId: genre.id,
        canCreateAlbums: true,
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
  const releaseDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

  const [album] = await Album.findOrCreate({
    where: { title: DEMO_ALBUM_TITLE, artistId: createdArtists[0].id },
    defaults: {
      artistId: createdArtists[0].id,
      title: DEMO_ALBUM_TITLE,
      release_date: releaseDate,
      albumType: "album",
      description:
        "A nine-track showcase album built for demonstrating the Uzinduzi " +
        "support-and-plaque flow. Fully populated with credits, features, " +
        "and production metadata.",
      copyright_info: `© ${new Date().getFullYear()} Uzinduzi Demo Recordings`,
      publisher: "Uzinduzi Demo Publishing",
      credits:
        "All songs written and performed by Soko. Produced by Mhofu and Gwenzi. " +
        "Recorded at Uzinduzi Studios, Harare. Mixed and mastered by T. Ncube and K. Moyo.",
      affiliation: "ZIMRA / ZIMCOPY",
      is_published: true,
      is_featured: true,
      isDemo: true,
    },
  });

  // Update album fields on re-run (findOrCreate only sets defaults once)
  album.description = album.description || "A nine-track showcase album...";
  album.copyright_info = album.copyright_info || `© ${new Date().getFullYear()} Uzinduzi Demo Recordings`;
  album.publisher = album.publisher || "Uzinduzi Demo Publishing";
  album.isDemo = true;
  await album.save();

  // ─── Genres (many-to-many) ────────────────────────────────
  const albumGenres = ["Afro Pop", "Afro Soul", "Amapiano"];
  for (const gName of albumGenres) {
    const [g] = await Genre.findOrCreate({
      where: { name: gName },
      defaults: { name: gName },
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
    const [, wasCreated] = await Track.findOrCreate({
      where: { albumId: album.id, trackNumber: i + 1 },
      defaults: {
        albumId: album.id,
        title: t.title,
        durationMs: t.durationMs,
        trackNumber: i + 1,
        featuredArtists: t.featuredArtists || null,
        trackArt: null,
        trackDescription: t.trackDescription,
        writer: t.writer,
        performedBy: t.performedBy,
        specialCredits: "Recorded at Uzinduzi Studios, Harare",
        backingVocals: t.backingVocals || null,
        instrumentation: t.instrumentation,
        releaseDate,
        producer: t.producer,
        masteringEngineer: t.masteringEngineer,
        mixingEngineer: t.mixingEngineer,
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
  album.duration = Math.round(totalMs / 1000);   // seconds
  await album.save();

  // ─── Launch — active now, ends in 30 days ─────────────────
  const startsAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const endsAt   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const physicalLaunchAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const [launch, launchCreated] = await AlbumLaunch.findOrCreate({
    where: { albumId: album.id },
    defaults: {
      albumId: album.id,
      startsAt,
      endsAt,
      physicalLaunchAt,
      status: "active",
      createdBy: admin.id,
      title: "Demo Showcase — Virtual Launch",
      description:
        "A month-long demo launch. Supports all tiers up to CRIMSON. " +
        "Demo accounts bypass payment for showcase purposes.",
      tierThresholds: [
        { tier: "SILVER",   minAmount: 51   },
        { tier: "GOLD",     minAmount: 150  },
        { tier: "SAPPHIRE", minAmount: 300  },
        { tier: "EMERALD",  minAmount: 600  },
        { tier: "CRIMSON",  minAmount: 1000 },
      ],
    },
  });

  // Make sure launch is active even on re-run
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
  console.log("─────────────────────────────────────────");
}

seed()
  .then(async () => { await sequelize.close(); process.exit(0); })
  .catch(async (err) => {
    console.error("\n❌ Seed failed:", err);
    await sequelize.close();
    process.exit(1);
  });