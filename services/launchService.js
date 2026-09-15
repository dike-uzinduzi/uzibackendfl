const { Album, AlbumLaunch } = require("../models");

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Compute the virtual launch window from a physical launch date.
 * 3 days before the physical launch → 7 days after.
 */
function computeLaunchWindow(physicalLaunchAt) {
  const base = new Date(physicalLaunchAt).getTime();
  return {
    startsAt: new Date(base - 3 * DAY_MS),
    endsAt:   new Date(base + 7 * DAY_MS),
  };
}

/**
 * Effective status accounting for the clock.
 * Stored status stays as-is; this returns what the world should see.
 */
function effectiveStatus(launch, now = new Date()) {
  if (!launch) return null;
  if (launch.status === "cancelled") return "cancelled";
  if (launch.status === "ended")     return "ended";
  if (now < new Date(launch.startsAt)) return "scheduled";
  if (now >= new Date(launch.endsAt))  return "ended";
  return "active";
}

async function getLaunchForAlbum(albumId) {
  const album = await Album.findByPk(albumId, {
    include: [{ model: AlbumLaunch, as: "launch" }],
  });
  if (!album) return null;
  return album.launch ? album.launch : null;
}

async function launchStateForAlbum(albumId) {
  const { Album, AlbumLaunch } = require("../models");
  const album = await Album.findByPk(albumId, {
    include: [{ model: AlbumLaunch, as: "launch" }],
  });
  if (!album) return { album: null, launch: null, status: null, tierThresholds: null };

  const launch = album.launch;
  const status = effectiveStatus(launch);

  return {
    album,
    launch,
    status,                                        // "scheduled" | "active" | "ended" | "cancelled" | null
    tierThresholds: launch?.tierThresholds || null,
  };
}

module.exports = {
  computeLaunchWindow,
  effectiveStatus,
  getLaunchForAlbum,
  launchStateForAlbum,
  DAY_MS,
};
module.exports = { computeLaunchWindow, effectiveStatus, getLaunchForAlbum, launchStateForAlbum, DAY_MS };