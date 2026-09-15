const trackService = require("../services/trackService");

class TrackController {

  async getAllTracks(req, res) {
    try {
      const tracks = await trackService.findAllTracks();
      res.json({ success: true, data: tracks, count: tracks.length });
    } catch (error) {
      console.error("getAllTracks error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTracksByAlbum(req, res) {
    try {
      const tracks = await trackService.findTracksByAlbum(req.params.albumId);
      res.json({ success: true, data: tracks, count: tracks.length });
    } catch (error) {
      console.error("getTracksByAlbum error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTrackById(req, res) {
    try {
      const track = await trackService.findTrackById(req.params.id);
      res.json({ success: true, data: track });
    } catch (error) {
      console.error("getTrackById error:", error);
      const status = error.message?.toLowerCase().includes("not found") ? 404 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async createTrack(req, res) {
    try {
      // Legacy field alias
      if (req.body.album && !req.body.albumId) req.body.albumId = req.body.album;
      delete req.body.album;

      const track = await trackService.createTrack(req.body);

      // trackService.createTrack already recomputes album counters.
      res.status(201).json({
        success: true,
        message: "Track created successfully",
        data: track,
      });
    } catch (error) {
      console.error("createTrack error:", error);
      const status = error.message?.toLowerCase().includes("required")
        ? 400 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async updateTrack(req, res) {
    try {
      if (req.body.album && !req.body.albumId) req.body.albumId = req.body.album;
      delete req.body.album;

      const track = await trackService.updateTrack(req.params.id, req.body);

      // trackService.updateTrack already recomputes album counters
      // for both the old and new album.

      res.json({
        success: true,
        message: "Track updated successfully",
        data: track,
      });
    } catch (error) {
      console.error("updateTrack error:", error);
      const status = error.message?.toLowerCase().includes("not found")
        ? 404
        : error.message?.toLowerCase().includes("invalid")
          ? 400 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }

  async deleteTrack(req, res) {
    try {
      const track = await trackService.deleteTrack(req.params.id);

      // trackService.deleteTrack already recomputes album counters.

      res.json({ success: true, message: "Track deleted successfully" });
    } catch (error) {
      console.error("deleteTrack error:", error);
      const status = error.message?.toLowerCase().includes("not found") ? 404 : 500;
      res.status(status).json({ success: false, message: error.message });
    }
  }
}

module.exports = new TrackController();