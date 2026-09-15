// scripts/reconcile-counters.js
require("dotenv").config();
const { sequelize, Album, Track, AlbumView, TrackLike } = require("../models");

async function reconcile() {
  await sequelize.sync();
  console.log("Reconciling counters...");

  const albums = await Album.findAll({ attributes: ["id"] });
  for (const a of albums) {
    const count = await AlbumView.count({ where: { albumId: a.id } });
    await Album.update({ viewCount: count }, { where: { id: a.id } });
  }

  const tracks = await Track.findAll({ attributes: ["id"] });
  for (const t of tracks) {
    const count = await TrackLike.count({ where: { trackId: t.id } });
    await Track.update({ likeCount: count }, { where: { id: t.id } });
  }

  console.log("Done.");
  process.exit(0);
}

reconcile().catch((e) => { console.error(e); process.exit(1); });