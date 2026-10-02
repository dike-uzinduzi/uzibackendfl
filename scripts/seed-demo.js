require("dotenv").config();
const { Op } = require("sequelize");
const {
  sequelize,
  User, Profile, Artist, Genre,
  Album, AlbumLaunch, AlbumGenre, Track,
} = require("../models");

const PASSWORD = "DemoPass123!";

const CDN = process.env.MEDIA_CDN_BASE || "https://pub-969b935d3cad4df4a4e9c86a6c18588c.r2.dev";
const PLACEHOLDER_AVATAR = `${CDN}/placeholders/avatar-default.png`;
const PLACEHOLDER_COVER  = `${CDN}/placeholders/cover-default.png`;
const PLACEHOLDER_ALBUM  = "https://app.uzinduziafrica.com/placeholders/album-cover-default.png";
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

// Index here = artistIndex used by DEMO_ALBUMS below.
const ARTISTS = [
  {
    userName: "demoartist1",
    email: "demoartist1@uzinduziafrica.com",
    stageName: "Ras Shinga",
    firstName: "Tendai",
    lastName: "Chikowore",
    genre: "Zimdancehall",
    bio: "Zimdancehall voice from Mbare. Hustled at Mbare Musika at twelve, recorded his first riddims on a borrowed laptop in the Matapi flats.",
    phone: "+263772222001",
    country: "Zimbabwe",
  },
  {
    userName: "demoartist2",
    email: "demoartist2@uzinduziafrica.com",
    stageName: "Takura Zinyemba & The Lowveld Stars",
    firstName: "Takura",
    lastName: "Zinyemba",
    genre: "Sungura",
    bio: "Twenty-five years of sungura, from beer halls in Chiredzi to weddings across the country. Dance with a proverb attached.",
    phone: "+263772222002",
    country: "Zimbabwe",
  },
  {
    userName: "demoartist3",
    email: "demoartist3@uzinduziafrica.com",
    stageName: "Nyasha Gumbo",
    firstName: "Nyasha",
    lastName: "Gumbo",
    genre: "Mbira Afro-fusion",
    bio: "Harare-raised vocalist and mbira player who inherited her grandmother's mbira at twenty-six. Ancient melodies meet modern drums and bass.",
    phone: "+263772222003",
    country: "Zimbabwe",
  },
  {
    userName: "demoartist4",
    email: "demoartist4@uzinduziafrica.com",
    stageName: "Kudzai Shereni",
    firstName: "Kudzai",
    lastName: "Shereni",
    genre: "Contemporary Gospel",
    bio: "Gospel singer whose voice returned after eleven months of silence. Praise and worship for church, weddings and kitchen parties.",
    phone: "+263772222004",
    country: "Zimbabwe",
  },
  {
    userName: "demoartist5",
    email: "demoartist5@uzinduziafrica.com",
    stageName: "Mandla Khumalo",
    firstName: "Mandla",
    lastName: "Khumalo",
    genre: "Afro Jazz",
    bio: "Bulawayo Afro-jazz pianist and singer. A decade in the city's clubs and a love letter to the place he refused to leave.",
    phone: "+263772222005",
    country: "Zimbabwe",
  },
];

// ─────────────────────────────────────────────────────────────
// Track helper: merges album-wide credits (c) with per-track data.
// Duration is given as minutes + seconds.
// ─────────────────────────────────────────────────────────────
const t = (c, title, m, s, featuredArtists, trackDescription, extra = {}) => ({
  ...c,
  title,
  durationMs: (m * 60 + s) * 1000,
  featuredArtists,
  performedBy: featuredArtists ? `${c.performedBy}, ${featuredArtists}` : c.performedBy,
  trackDescription,
  specialCredits: null,
  likeCount: 0,
  ...extra,
});

// ─────────────────────────────────────────────────────────────
// Album-wide credits
// ─────────────────────────────────────────────────────────────
const C1 = {
  writer: "Ras Shinga, Blessing \"Bhoyi\" Nyamande",
  producer: "Tafadzwa \"Riddim Doctor\" Marufu",
  performedBy: "Ras Shinga",
  backingVocals: "Rutendo Kays, Tapiwa Sango, The Matapi Youth",
  instrumentation: "Keys and programming (Tafadzwa Marufu), Guitar (Simba Gwatidzo)",
  mixingEngineer: "Prince Marange",
  masteringEngineer: "Chiedza Mupandawana",
};

const C2 = {
  writer: "Takura Zinyemba",
  producer: "Bothwell Chidavaenzi",
  performedBy: "Takura Zinyemba & The Lowveld Stars",
  backingVocals: "Mai Rumbi Zinyemba, Patience Mabika, Vimbai Chauke",
  instrumentation: "Rhythm guitar (Takura Zinyemba), Lead guitar (Bothwell Chidavaenzi), Bass guitar (Lovemore \"Bhasi\" Chauke), Drums (Admire Hlungwani)",
  mixingEngineer: "Gift Mapuranga",
  masteringEngineer: "Chiedza Mupandawana",
};

const C3 = {
  writer: "Nyasha Gumbo, Ruvimbo Chikwanha",
  producer: "Farai Mutasa",
  performedBy: "Nyasha Gumbo",
  backingVocals: "Ruvimbo Chikwanha, Amai Esinath Gumbo, The Hosho Sisters",
  instrumentation: "Mbira (Nyasha Gumbo), Mbira second part kushaura/kutsinhira (Sekuru Muchemwa), Hosho and ngoma drums (Tinashe Mukonoweshuro), Bass guitar (Kundai Sithole)",
  mixingEngineer: "Farai Mutasa",
  masteringEngineer: "Prince Marange",
};

const C4 = {
  writer: "Kudzai Shereni, Grace Mahachi",
  producer: "Pastor Elijah Musoni",
  performedBy: "Kudzai Shereni",
  backingVocals: "Vaimbi VeRudo (Tatenda Moyo, Ruvarashe Dube, Fadzai Nyoni, Takudzwa Shereni)",
  instrumentation: "Keys (Elijah Musoni), Lead guitar (Ignatius Chakanyuka), Drums (Panashe Mhlanga)",
  mixingEngineer: "Gift Mapuranga",
  masteringEngineer: "Chiedza Mupandawana",
};

const C5 = {
  writer: "Mandla Khumalo, Zanele Ngwenya",
  producer: "Sipho \"Bra Sips\" Mlilo",
  performedBy: "Mandla Khumalo",
  backingVocals: "Zanele Ngwenya, Thulani Nkomo",
  instrumentation: "Piano (Mandla Khumalo), Saxophone (Bekithemba Tshuma), Trumpet (Lwazi Mathe), Bass guitar (Nkosinathi Dlodlo)",
  mixingEngineer: "Sipho Mlilo",
  masteringEngineer: "Prince Marange",
};

// ─────────────────────────────────────────────────────────────
// Albums with full track lists (source: Demo_Album_Catalogue.docx)
// Release dates are absolute and all sit inside the pre-launch window.
// ─────────────────────────────────────────────────────────────
const DEMO_ALBUMS = [
  // ── Album 1 ────────────────────────────────────────────────
  {
    title: "Ghetto Yuniveziti",
    artistIndex: 0,
    albumType: "album",
    isFeatured: true,
    releaseDate: "2026-11-20",
    description:
      "Ras Shinga never finished Form Four. He says he got his real education in Mbare: hustling at Mbare Musika at twelve, learning to read people on the kombi ranks, and recording his first riddims on a borrowed laptop in the Matapi flats. Ghetto Yuniveziti (Ghetto University) is his graduation.\n\n" +
      "Each song is a lesson the ghetto taught him: respect your mother, look after your crew, laugh when ZESA takes the lights, and never let anyone tell you where you come from decides where you end up. It is a record for every young Zimbabwean who has been written off and is still standing, and for every family that has a son or daughter overseas wondering if home still remembers them.",
    publisher: "Matapi Sound",
    affiliation: "ZIMRA / ZIMCOPY",
    credits:
      "Lead vocals: Ras Shinga (Tendai Chikowore). Featured artists: Rutendo Kays (track 4), Kosi Mpofu (track 6). " +
      "Producer: Tafadzwa \"Riddim Doctor\" Marufu. Composers: Ras Shinga, Tafadzwa Marufu. " +
      "Writers: Ras Shinga, Blessing \"Bhoyi\" Nyamande. Backing vocals: Rutendo Kays, Tapiwa Sango, The Matapi Youth. " +
      "Keys, programming: Tafadzwa Marufu. Guitar: Simba Gwatidzo. " +
      "Mixing engineer: Prince Marange. Mastering engineer: Chiedza Mupandawana.",
    genres: ["Zimdancehall", "Reggae"],
    tracks: [
      t(C1, "Mbare Musika", 2, 41, null,
        "This is where it all started. Before he was Ras Shinga, he was a twelve-year-old boy pushing a wheelbarrow of tomatoes through Mbare Musika at 5am to help his mother pay school fees. The opening track is his thank-you to the vendors, touts and traders who fed him, scolded him and taught him that hard work has no shame. If you have ever bought from a vendor who knew your name, this one is for you."),
      t(C1, "Ghetto Yuniveziti", 3, 34, null,
        "Ras wrote this the night a former teacher saw him on TV and said, \"I never thought you would amount to anything.\" Instead of anger, he wrote an anthem. The song lists the \"degrees\" the ghetto gave him: patience, street wisdom, loyalty and faith. It is a proud reply to everyone who was told they would fail, and a reminder that your address is not your destiny."),
      t(C1, "Kombi Yekupedzisira", 3, 18, null,
        "Every Harare worker knows the panic of missing the last kombi home. Ras turns that nightly race into a story about chasing a girl he met on the Mbare to Chitungwiza route, always one stop too late to speak to her. Funny, sweet and full of kombi-rank slang, it is a love song about the small chances we let slip by."),
      t(C1, "Mai Vangu", 4, 2, "Rutendo Kays",
        "The most personal song Ras has ever written. His mother raised four children alone, selling freezits and second-hand clothes, and never once let them see her cry. He recorded this after she was hospitalised last year, afraid he had never told her what she meant to him. Rutendo Kays sings the chorus as every mother's voice. Have tissues ready, then call your mother."),
      t(C1, "ZESA Yaenda", 3, 11, null,
        "Lights out again? Ras refuses to let load-shedding win. This song is about the joy Zimbabweans find in the dark: neighbours gathering around a fire, phones used as torches, kids playing in the street and someone always starting a song. It is pure celebration, written to remind us that even when ZESA goes, our spirit stays on."),
      t(C1, "Diaspora Call", 3, 46, "Kosi Mpofu",
        "Ras's older brother left for the UK in 2008 and has not been home since. Bulawayo's Kosi Mpofu, whose own sister works in Johannesburg, joins him in Shona, isiNdebele and English. Together they tell both sides of the WhatsApp call: the one sending money and missing funerals, and the one at home pretending everything is fine. For every family split across borders."),
      t(C1, "Hatidi Hondo", 3, 57, null,
        "After seeing friends hurt in violence around elections and between rival crews, Ras wrote a plea for peace. \"Hatidi hondo\" means \"we don't want war\", and the song asks young people not to let anyone use their anger for someone else's gain. A serious, heartfelt message from a man who has seen what division does to a community."),
      t(C1, "Shinga", 4, 20, null,
        "The closing anthem and the meaning behind his name. \"Shinga\" means be strong, the word his grandmother whispered to him whenever life knocked him down. He wrote it for anyone facing a battle right now: unemployment, illness, heartbreak or doubt. Built to be shouted together in a stadium, it sends you out of the album believing you can rise again."),
    ],
  },

  // ── Album 2 ────────────────────────────────────────────────
  {
    title: "Rwendo",
    artistIndex: 1,
    albumType: "album",
    isFeatured: false,
    releaseDate: "2026-12-04",
    description:
      "Takura Zinyemba has played sungura for twenty-five years, from beer halls in Chiredzi to weddings across the country. Rwendo (The Journey) is the album he says he waited his whole life to make: the story of his own road from a sugar-cane worker's son to a bandleader.\n\n" +
      "The songs follow that journey and the people met along the way: the wife who believed in him when no one else did, the grandfather who gave him his first guitar, the child who left for Johannesburg, and the false friend who nearly took everything. Like the best sungura, it mixes dance with wisdom. You will move your feet, and then you will hear a proverb that stays with you for weeks.",
    publisher: "Lowveld Sounds",
    affiliation: "ZIMRA / ZIMCOPY",
    credits:
      "Lead vocals, rhythm guitar: Takura Zinyemba. Band: The Lowveld Stars. Lead guitar: Bothwell Chidavaenzi. " +
      "Bass guitar: Lovemore \"Bhasi\" Chauke. Drums: Admire Hlungwani. Producer: Bothwell Chidavaenzi. " +
      "Composers: Takura Zinyemba, Bothwell Chidavaenzi. Writer: Takura Zinyemba. " +
      "Backing vocals and dancers: Mai Rumbi Zinyemba, Patience Mabika, Vimbai Chauke. " +
      "Mixing engineer: Gift Mapuranga. Mastering engineer: Chiedza Mupandawana.",
    genres: ["Sungura"],
    tracks: [
      t(C2, "Rwendo", 5, 12, null,
        "Takura opens with the question every Zimbabwean asks at some point: where is this road taking me? He sings about leaving the sugar-cane fields of Chiredzi at seventeen with nothing but a guitar and his mother's blessing. It is a song for anyone who has had to start from zero, and it sets the tone for an album about faith, hard work and the people who carry us."),
      t(C2, "Mukadzi Wangu", 4, 48, null,
        "When Takura's band collapsed in 2009, it was his wife Rumbi who sold her chickens to buy him new strings and told him not to give up. This is his love song to her, and to every woman who holds a family together when money is short. Rumbi sings the backing vocals herself. Couples will be dancing to this one at every wedding this season."),
      t(C2, "Bhazi Rekumusha", 4, 21, null,
        "It is December, and the whole country is going kumusha. Takura captures the chaos and joy of the bus ride home: the conductor shouting, bags of groceries on every lap, a chicken under a seat, and the excitement of seeing family again. Written after twenty years of Christmas journeys, it is the sound of the festive season in Zimbabwe."),
      t(C2, "Mwana Waenda kuJoni", 5, 35, null,
        "Takura's eldest son crossed the border to Johannesburg three years ago and calls less every month. In this song, a father speaks to a child far away: \"Do not forget where you come from, do not forget your mother's food.\" Every family with someone in South Africa will hear their own story in it."),
      t(C2, "Sekuru Vangu", 4, 6, null,
        "His grandfather, a farmer in Masvingo, made Takura's first guitar from a cooking-oil tin and fishing line. This upbeat jiti track celebrates the old man's humour, his proverbs and his belief that a boy from the village could become a musician. It is a tribute to the elders who saw something in us before we saw it ourselves."),
      t(C2, "Shamwari Yenhema", 4, 30, null,
        "The friend who shared his plate, then took his band's earnings and disappeared. Takura does not name him, but the lesson is clear: not everyone who laughs with you is your friend. Filled with sharp proverbs and a guitar line that will not leave your head, this is the song people will quote to each other."),
      t(C2, "Nzara", 5, 3, null,
        "Takura was ten during the 1992 drought, when his family survived on one meal a day. He wrote this slow, heavy song to remember those years and to honour the parents who went hungry so their children could eat. It is a reminder of how far many families have come, and a prayer for the rains to keep falling."),
      t(C2, "Tichasangana", 5, 44, null,
        "The album closes with a goodbye that is also a promise. Takura dedicates it to his late bandmate, guitarist Shingi Mabika, who died before this record was made. \"Tichasangana\" means \"we will meet again\". It is a celebration of life, written to be danced to at a memorial, because, as Takura says, sungura was always meant to heal.",
        { specialCredits: "Dedicated to the late Shingi Mabika" }),
    ],
  },

  // ── Album 3 ────────────────────────────────────────────────
  {
    title: "Mhepo YeMadzitateguru",
    artistIndex: 2,
    albumType: "album",
    isFeatured: false,
    releaseDate: "2026-11-13",
    description:
      "Nyasha Gumbo grew up in Harare's northern suburbs, speaking more English than Shona and knowing almost nothing about her family's roots. At twenty-six she inherited her grandmother's mbira, an instrument no one in the family had played in forty years. Mhepo YeMadzitateguru (Wind of the Ancestors) is the record of what happened when she learned to play it.\n\n" +
      "The album is about reconnecting: with a village she had only visited at funerals, with the stone walls of Great Zimbabwe, with the strength of Zimbabwean women, and with a heritage many young urban Zimbabweans feel they are losing. Ancient mbira melodies meet modern drums and bass. It is a proud, spiritual record for anyone who has ever felt caught between who they are and where they come from.",
    publisher: "Dzimbahwe Records",
    affiliation: "ZIMRA / ZIMCOPY",
    credits:
      "Lead vocals, mbira: Nyasha Gumbo. Featured artists: Sekuru Muchemwa (track 4), Thando Sibanda (track 7). " +
      "Producer: Farai Mutasa. Composers: Nyasha Gumbo, Farai Mutasa. Writers: Nyasha Gumbo, Ruvimbo Chikwanha. " +
      "Backing vocals: Ruvimbo Chikwanha, Amai Esinath Gumbo, The Hosho Sisters. " +
      "Mbira (second part, kushaura/kutsinhira): Sekuru Muchemwa. Hosho, ngoma drums: Tinashe Mukonoweshuro. " +
      "Bass guitar: Kundai Sithole. Mixing engineer: Farai Mutasa. Mastering engineer: Prince Marange.",
    genres: ["Mbira", "Afro Fusion", "Afro Pop"],
    tracks: [
      t(C3, "Kumusha", 4, 15, null,
        "The first time Nyasha travelled to her grandmother's village in Murehwa without a funeral to attend, she felt like a stranger. Children laughed at her Shona. By the end of the week, they were teaching her songs. This opening track is about that homecoming and the quiet shame many urban Zimbabweans feel about not knowing their roots. It is a gentle invitation to go home and listen."),
      t(C3, "Dzimbabwe", 4, 52, null,
        "Standing inside the Great Enclosure at Great Zimbabwe, Nyasha asked herself who built these walls and what they would think of us now. The song is a proud celebration of a civilisation that built in stone without mortar, and a challenge to young Zimbabweans to build something that lasts. It is the album's statement of who we are as a people."),
      t(C3, "Mhepo", 3, 58, null,
        "Her grandmother used to say that when the wind moves the trees at dusk, the ancestors are passing by. Nyasha wrote this song on the night she first played the inherited mbira and swore she felt that wind in the room. It is about the presence of those who came before us and the comfort of never being truly alone."),
      t(C3, "Ambuya Vangu", 5, 10, "Sekuru Muchemwa",
        "The heart of the album. Nyasha's grandmother played mbira at village ceremonies until she was told by church elders in the 1980s to stop. She never played again. Sekuru Muchemwa, an elder mbira master who knew her as a young woman, plays alongside Nyasha on the very same instrument. This is a granddaughter finishing a song her grandmother was forced to leave unfinished."),
      t(C3, "Chimanimani", 4, 37, null,
        "In March 2019 Cyclone Idai tore through Chimanimani, and Nyasha's cousin lost her home. Nyasha spent two weeks there as a volunteer. This song honours the people who died, the families still rebuilding, and the neighbours who dug through mud with bare hands to save strangers. Part of the proceeds from this track will go to community rebuilding projects in the district."),
      t(C3, "Simuka Mukadzi", 3, 44, null,
        "\"Rise, woman.\" Written for the women Nyasha met while making this album: the vendor raising five children alone, the farmer who ploughs her own land, the girl fighting to stay in school. It is the most upbeat song on the record and a celebration of the backbone of every Zimbabwean family. Expect to see it on every Women's Day playlist."),
      t(C3, "Ubuntu", 4, 6, "Thando Sibanda",
        "Nyasha met Bulawayo singer Thando Sibanda at a festival and realised how little she knew about her Ndebele neighbours, and how much they shared. Sung in Shona and isiNdebele, \"Ubuntu\" means \"I am because we are\". It is a song about unity across languages and regions, and a reminder that Zimbabwe's strength has always been its people together."),
      t(C3, "Bira", 6, 2, null,
        "A bira is an all-night ceremony where families gather with mbira to call on the ancestors. Nyasha's family held one in the village to welcome her grandmother's mbira back into use, and this closing track recreates that night. It builds slowly and hypnotically, and by the end it feels like the whole family, living and departed, is in the room."),
    ],
  },

  // ── Album 4 ────────────────────────────────────────────────
  {
    title: "Mufaro Mangwanani",
    artistIndex: 3,
    albumType: "album",
    isFeatured: false,
    releaseDate: "2026-11-27",
    description:
      "Three years ago, gospel singer Kudzai Shereni lost her voice to a throat illness. Doctors in Harare told her she might never sing again. For eleven months she prayed in silence. Mufaro Mangwanani (Joy Comes in the Morning) is the album she promised God she would record if her voice returned.\n\n" +
      "Taken from Psalm 30:5, \"weeping may endure for a night, but joy comes in the morning\", the album moves from the long night of waiting into a sunrise of praise. Some songs are quiet prayers; others are full makwaya celebrations made for church, weddings and kitchen parties. It is a message of hope for anyone in Zimbabwe or the diaspora who is still waiting for their morning.",
    publisher: "Rufaro Gospel Music",
    affiliation: "ZIMRA / ZIMCOPY",
    credits:
      "Lead vocals: Kudzai Shereni. Featured artists: Chipinge Mission Youth Choir (track 4), Blessing Ndlovu (track 6). " +
      "Producer: Pastor Elijah Musoni. Composers: Kudzai Shereni, Elijah Musoni. Writers: Kudzai Shereni, Grace Mahachi. " +
      "Backing vocals: Vaimbi VeRudo (Tatenda Moyo, Ruvarashe Dube, Fadzai Nyoni, Takudzwa Shereni). " +
      "Keys: Elijah Musoni. Lead guitar: Ignatius Chakanyuka. Drums: Panashe Mhlanga. " +
      "Mixing engineer: Gift Mapuranga. Mastering engineer: Chiedza Mupandawana.",
    genres: ["Contemporary Gospel", "Praise and Worship"],
    tracks: [
      t(C4, "Mangwanani", 3, 40, null,
        "The first sound Kudzai made when her voice came back was a single, shaky hum one Sunday morning. This short worship song begins in that same whisper and grows into her full voice. It is a moment of pure gratitude and a gentle way to open your heart before the album begins."),
      t(C4, "Mufaro Mangwanani", 4, 25, null,
        "The title song is Kudzai's testimony in four minutes. She sings about the long nights in hospital, the friends who stopped visiting and the faith that held her. Then the chorus breaks into joy. It is written for anyone in the middle of their own night: unemployed, unwell, grieving or waiting. Your morning is coming."),
      t(C4, "Mwari Vanoona", 4, 58, null,
        "\"God sees.\" Kudzai wrote this after meeting a woman in the hospital ward who had no visitors and no money for medicine, yet sang hymns every evening. The song is a reminder that no struggle goes unseen, even when the world looks away. Expect this to become a favourite at prayer meetings."),
      t(C4, "Ndiri Wako", 4, 20, "Chipinge Mission Youth Choir",
        "Kudzai first sang in a choir at Chipinge mission school, and she went back to record this song with today's students. Fifty young voices join her in a surrender song: \"I am yours.\" It is a tribute to the mission schools that shaped generations of Zimbabwean singers, and a passing of the torch to the next."),
      t(C4, "Amai Vakanamata", 4, 12, null,
        "During her illness, Kudzai's mother woke at 4am every day to pray for her at the family's rural home in Mutoko. Kudzai only found out months later. This tender song honours praying mothers everywhere. If someone has ever prayed you through a hard season, this is the song to send them."),
      t(C4, "Tsitsi", 4, 34, "Blessing Ndlovu",
        "Kudzai and Bulawayo gospel singer Blessing Ndlovu sing about the mercy that gives us second chances, in Shona and isiNdebele. Blessing joined after sharing his own story of recovery from addiction. It is an uplifting Afro-gospel song for anyone who has fallen and is learning to stand again."),
      t(C4, "Ruoko Rwako", 3, 50, null,
        "\"Your hand.\" A quiet prayer song for the moments when there is nothing left to do but trust. Kudzai wrote it the night before the surgery that saved her voice. Simple, honest and beautiful, it is the song for when words fail."),
      t(C4, "Tinokutendai", 5, 16, null,
        "The album ends in celebration. \"We thank you\" is a full makwaya praise song with drums, dancing and call-and-response, written to be sung loudly at church and at family gatherings. Kudzai calls it her thank-you to God, her family and every fan who prayed for her. Get ready to dance."),
    ],
  },

  // ── Album 5 ────────────────────────────────────────────────
  {
    title: "Umuzi WamaKhosi",
    artistIndex: 4,
    albumType: "album",
    isFeatured: false,
    releaseDate: "2026-12-11",
    description:
      "Bulawayo is called the City of Kings, but Mandla Khumalo says it is the city everyone leaves. Half his school friends now live in Johannesburg, and he nearly followed them. Instead he stayed, played Afro-jazz in Bulawayo's clubs for a decade, and wrote Umuzi WamaKhosi (City of Kings) as a love letter to the place he refused to give up on.\n\n" +
      "Sung mostly in isiNdebele, with Shona and English, the album walks through Bulawayo life: Sunday lunches at gogo's house, the water cuts, the long road to Egoli, the Matobo Hills at sunset, and a love that crosses Zimbabwe's language lines. Warm horns, township jazz and a touch of amapiano make it both nostalgic and new. It is for everyone who calls Bulawayo home, wherever they live now.",
    publisher: "Kings Gate Records",
    affiliation: "ZIMRA / ZIMCOPY",
    credits:
      "Lead vocals, piano: Mandla Khumalo. Featured artists: Nomvula Moyo (track 3), Tinashe Mutero (track 7). " +
      "Producer: Sipho \"Bra Sips\" Mlilo. Composers: Mandla Khumalo, Sipho Mlilo. Writers: Mandla Khumalo, Zanele Ngwenya. " +
      "Backing vocals: Zanele Ngwenya, Thulani Nkomo, Ingoma Yesizwe Choir (track 8). " +
      "Saxophone: Bekithemba Tshuma. Trumpet: Lwazi Mathe. Bass guitar: Nkosinathi Dlodlo. " +
      "Mixing engineer: Sipho Mlilo. Mastering engineer: Prince Marange.",
    genres: ["Afro Jazz", "Afro Pop"],
    tracks: [
      t(C5, "Ekhaya", 3, 30, null,
        "Mandla opens on his grandmother's stoep in Makokoba, the oldest township in Bulawayo, where he first heard his uncle's jazz records. The song is about what \"home\" means when everyone around you is leaving. It is warm, unhurried and full of the sounds and smells of a Bulawayo evening, a perfect welcome into the album."),
      t(C5, "Umuzi WamaKhosi", 3, 58, null,
        "The title track is Mandla's proud anthem for Bulawayo: its wide streets, its jacaranda trees, its football, its humour and its people. He wrote it after hearing a radio host call the city \"forgotten\". This is his answer: Bulawayo is not forgotten, it is royal. Every Bulawayo native at home and abroad will want to sing this one."),
      t(C5, "Egoli Calling", 4, 12, "Nomvula Moyo",
        "Almost every family in Matabeleland has someone in Johannesburg. Nomvula Moyo, a Bulawayo singer now based in Joburg, sings as the one who left; Mandla sings as the one who stayed. Over an amapiano groove, they talk about ambition, homesickness and the guilt that comes with both choices. It is a dance-floor song with a heavy heart."),
      t(C5, "Matopos", 4, 45, null,
        "Mandla climbed World's View in the Matobo Hills the day he decided to stay in Zimbabwe. He wrote this song sitting on the rocks, watching the sun go down over land his ancestors have known for centuries. It is a peaceful, almost spiritual song about belonging to the land, and about the quiet strength of the hills."),
      t(C5, "Amanzi", 3, 36, null,
        "Bulawayo residents know the struggle: taps that run dry for days, queues at boreholes, buckets everywhere. Mandla turns this daily frustration into a moving song about resilience and community, about neighbours who share their last bucket of water. It is gentle in sound but honest in message, and it speaks for a whole city."),
      t(C5, "Gogo's Kitchen", 3, 22, null,
        "Every Sunday, Mandla's gogo cooked isitshwala, beef stew and greens for anyone who came through the gate, family or not. This joyful kwela-inspired song is a celebration of grandmothers who feed whole neighbourhoods. It will make you hungry, it will make you smile, and it will make you want to visit your gogo."),
      t(C5, "Thandeka", 4, 8, "Tinashe Mutero",
        "Mandla's real-life wife is from Harare, and their families took a while to warm to the idea of a Ndebele-Shona marriage. In this duet, Harare singer Tinashe Mutero sings in Shona and Mandla answers in isiNdebele. It is a romantic, playful song about love that does not care about tribe or language, and a quiet message of unity for Zimbabwe."),
      t(C5, "Siyaphila", 5, 5, null,
        "\"We are well.\" It is what Ndebele families say to each other, even in hard times. The song begins with an a cappella imbube choir before the full band joins in, and it closes the album with a message of hope: Bulawayo is still here, its people are still standing, and the City of Kings will rise again.",
        { backingVocals: "Zanele Ngwenya, Thulani Nkomo, Ingoma Yesizwe Choir" }),
    ],
  },
];

async function seed() {
  await sequelize.sync();
  console.log("🌱 Seeding demo accounts with full data...\n");

  // ─── Admin (for launch createdBy) ─────────────────────────
  const admin = await User.findOne({
    where: { role: ["admin", "super_admin"] },
  });
  if (!admin) {
    console.warn("⚠️  No admin or super_admin user found.");
    console.warn("    Add SUPER_ADMIN_EMAIL and SUPER_ADMIN_DEFAULT_PASSWORD to .env");
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

    // Re-run: refresh identity in case these demo accounts were seeded with the previous artists
    await Profile.update(
      { firstName: a.firstName, lastName: a.lastName, bio: a.bio },
      { where: { userId: user.id } },
    );
    artist.name = a.stageName;
    artist.stageName = a.stageName;
    artist.firstName = a.firstName;
    artist.lastName = a.lastName;
    artist.bio = a.bio;
    artist.genreId = genre.id;
    artist.canCreateAlbums = true;
    await artist.save();

    createdArtists.push(artist);
    console.log(`✅ Demo Artist  → ${a.email}  (stage: ${a.stageName}, genre: ${a.genre})`);
  }

  // ─── Retire demo albums that are no longer in the catalogue ─
  const keepTitles = DEMO_ALBUMS.map(a => a.title);
  const [retired] = await Album.update(
    { is_deleted: true, is_published: false, is_featured: false },
    { where: { isDemo: true, title: { [Op.notIn]: keepTitles } } },
  );
  if (retired) console.log(`🗑️  Retired ${retired} old demo album(s) (soft-deleted)`);

  // ─── Albums + tracks ──────────────────────────────────────
  const createdAlbums = [];

  for (const albumData of DEMO_ALBUMS) {
    const ownerArtist = createdArtists[albumData.artistIndex];
    const releaseDate = new Date(`${albumData.releaseDate}T00:00:00Z`);

    const totalMs = albumData.tracks.reduce((s, tr) => s + tr.durationMs, 0);

    const [album] = await Album.findOrCreate({
      where: { title: albumData.title, artistId: ownerArtist.id },
      defaults: {
        artistId: ownerArtist.id,
        title: albumData.title,
        release_date: releaseDate,
        albumType: albumData.albumType,
        cover_art: PLACEHOLDER_ALBUM,
        hasCustomCoverArt: false,
        description: albumData.description,
        copyright_info: `© ${new Date().getFullYear()} Uzinduzi Demo Recordings`,
        publisher: albumData.publisher,
        credits: albumData.credits,
        affiliation: albumData.affiliation,
        is_published: true,
        is_featured: albumData.isFeatured,
        isDemo: true,
        is_deleted: false,
        viewCount: 0,
        track_count: albumData.tracks.length,
        duration: Math.round(totalMs / 1000),
      },
    });

    // Backfill on re-run
    album.cover_art = PLACEHOLDER_ALBUM;
    album.description = album.description || albumData.description;
    album.copyright_info = album.copyright_info || `© ${new Date().getFullYear()} Uzinduzi Demo Recordings`;
    album.publisher = album.publisher || albumData.publisher;
    album.credits = album.credits || albumData.credits;
    album.affiliation = album.affiliation || albumData.affiliation;
    album.release_date = releaseDate;
    album.isDemo = true;
    album.is_published = true;
    album.is_deleted = false;
    await album.save();

    // Genres
    for (const gName of albumData.genres) {
      const [g] = await Genre.findOrCreate({
        where: { name: gName },
        defaults: { name: gName, description: `${gName} — demo genre` },
      });
      await AlbumGenre.findOrCreate({
        where: { albumId: album.id, genreId: g.id },
        defaults: { albumId: album.id, genreId: g.id },
      });
    }

    // Tracks
    let newTracks = 0;
    for (let i = 0; i < albumData.tracks.length; i++) {
      const tr = albumData.tracks[i];
      const [_, wasCreated] = await Track.findOrCreate({
        where: { albumId: album.id, trackNumber: i + 1 },
        defaults: {
          albumId: album.id,
          title: tr.title,
          durationMs: tr.durationMs,
          trackNumber: i + 1,
          featuredArtists: tr.featuredArtists,
          trackArt: PLACEHOLDER_TRACK,
          hasCustomTrackArt: false,
          trackDescription: tr.trackDescription,
          writer: tr.writer,
          performedBy: tr.performedBy,
          specialCredits: tr.specialCredits,
          backingVocals: tr.backingVocals,
          instrumentation: tr.instrumentation,
          releaseDate,
          producer: tr.producer,
          masteringEngineer: tr.masteringEngineer,
          mixingEngineer: tr.mixingEngineer,
          likeCount: tr.likeCount,
          isPublished: true,
          isDeleted: false,
        },
      });
      if (wasCreated) newTracks++;
    }

    // Recompute counters from actual rows
    const tracks = await Track.findAll({ where: { albumId: album.id } });
    const totalActualMs = tracks.reduce((s, tr) => s + (tr.durationMs || 0), 0);
    album.track_count = tracks.length;
    album.duration = Math.round(totalActualMs / 1000);
    await album.save();

    createdAlbums.push({ album, tracks, newTracks });
    console.log(
      `✅ Demo Album   → "${albumData.title}" (${albumData.albumType}, ${ownerArtist.stageName}) — ${tracks.length} tracks`,
    );
  }

  // ─── Launch on the featured album ─────────────────────────
  const featured = createdAlbums.find(c => c.album.is_featured);
  let launch = null;

  if (featured) {
    const startsAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endsAt   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const physicalLaunchAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const [launchRow] = await AlbumLaunch.findOrCreate({
      where: { albumId: featured.album.id },
      defaults: {
        albumId: featured.album.id,
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

    if (launchRow.status !== "active" || new Date(launchRow.endsAt) < new Date()) {
      launchRow.startsAt = startsAt;
      launchRow.endsAt = endsAt;
      launchRow.status = "active";
      await launchRow.save();
    }

    launch = launchRow;
  }

  // ─── Summary ──────────────────────────────────────────────
  const totalTracks = createdAlbums.reduce((s, c) => s + c.tracks.length, 0);

  console.log(`\n🎵 Demo albums  → ${createdAlbums.length} total  (${totalTracks} tracks)\n`);
  for (const { album, tracks } of createdAlbums) {
    const mins = Math.floor(album.duration / 60);
    const secs = String(album.duration % 60).padStart(2, "0");
    const star = album.is_featured ? '★ ' : '  ';
    console.log(`${star}${album.title}`);
    console.log(`   ID: ${album.id}`);
    console.log(`   Tracks: ${tracks.length}  Duration: ${mins}:${secs}  Release: ${new Date(album.release_date).toISOString().slice(0, 10)}`);
  }

  if (launch) {
    console.log(`\n   Launch       → active until ${launch.endsAt.toISOString().slice(0, 10)}`);
  }

  console.log("\n─────────────────────────────────────────");
  console.log("Demo logins (same password for all):");
  console.log(`   ${PASSWORD}\n`);
  console.log("   Fans:");
  FANS.forEach(f => console.log(`     ${f.email}`));
  console.log("\n   Artists:");
  ARTISTS.forEach(a => console.log(`     ${a.email}`));
  console.log("─────────────────────────────────────────\n");
}

seed()
  .then(async () => { await sequelize.close(); process.exit(0); })
  .catch(async (err) => {
    console.error("\n❌ Seed failed:", err);
    await sequelize.close();
    process.exit(1);
  });