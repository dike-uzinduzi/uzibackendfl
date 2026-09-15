const { Track, Album } = require("../models");

class TrackService {

  // ─── Recompute denormalized album counters ────────────────
  async _recomputeAlbumCounters(albumId) {
    if (!albumId) return;

    const tracks = await Track.findAll({
      where: { albumId, isDeleted: false },
      attributes: ["durationMs"],
    });

    const totalMs = tracks.reduce((sum, t) => sum + (t.durationMs || 0), 0);

    await Album.update(
      {
        track_count: tracks.length,
        duration: Math.round(totalMs / 1000),
      },
      { where: { id: albumId } }
    );
  }

  async findAllTracks(filter = {}) {
    return Track.findAll({
      where: { ...filter, isDeleted: false },
      include: [
        {
          model: Album,
          attributes: ["id", "title", "cover_art", "artistId"],
        },
      ],
      order: [["trackNumber", "ASC"]],
    });
  }

  async findTracksByAlbum(albumId) {
    return Track.findAll({
      where: { albumId, isDeleted: false },
      order: [["trackNumber", "ASC"]],
    });
  }

  async findTrackById(id) {
    const track = await Track.findOne({
      where: { id, isDeleted: false },
      include: [
        {
          model: Album,
          attributes: ["id", "title", "cover_art", "artistId"],
        },
      ],
    });

    if (!track) throw new Error("Track not found");
    return track;
  }

  async createTrack(trackData) {
    const track = await Track.create(trackData);
    if (track.albumId) await this._recomputeAlbumCounters(track.albumId);
    return track;
  }

  async updateTrack(id, updateData) {
    const track = await Track.findOne({ where: { id, isDeleted: false } });
    if (!track) throw new Error("Track not found");

    const previousAlbumId = track.albumId;

    await track.update(updateData);

    await this._recomputeAlbumCounters(previousAlbumId);
    if (updateData.albumId && updateData.albumId !== previousAlbumId) {
      await this._recomputeAlbumCounters(updateData.albumId);
    }

    return track;
  }

  async deleteTrack(id) {
    const track = await Track.findOne({ where: { id, isDeleted: false } });
    if (!track) throw new Error("Track not found");

    const albumId = track.albumId;
    await track.update({ isDeleted: true });
    await this._recomputeAlbumCounters(albumId);

    return track;
  }
}

module.exports = new TrackService();