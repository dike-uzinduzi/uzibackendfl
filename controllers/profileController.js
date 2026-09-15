const profileService = require("../services/profileService");

class ProfileController {

  // GET /api/profiles
  async getAllProfiles(req, res) {
    try {
      const profiles = await profileService.findAllProfiles();
      return res.status(200).json({
        success: true,
        data: profiles,
        count: profiles.length,
      });
    } catch (error) {
      console.error("getAllProfiles error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/profiles/me
  async getMyProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      let profile;

      try {
        profile = await profileService.findProfileByUserId(userId);
      } catch (err) {
        if (err.message === "Profile not found") {
          // Auto-create minimal profile so the client has something to render
          profile = await profileService.createProfile(
            {
              firstName: req.user.userName || "User",
              lastName: "",
              contactEmail: req.user.email || null,
            },
            userId
          );
        } else {
          throw err;
        }
      }

      return res.status(200).json({ success: true, data: profile });
    } catch (error) {
      console.error("getMyProfile error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET /api/profiles/:id
  async getProfileById(req, res) {
    try {
      const profile = await profileService.findProfileById(req.params.id);
      return res.status(200).json({ success: true, data: profile });
    } catch (error) {
      console.error("getProfileById error:", error);
      const status = error.message?.toLowerCase().includes("not found") ? 404 : 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  // POST /api/profiles
  async createProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // Strip fields that aren't client-settable
      const payload = { ...req.body };
      delete payload.userId;
      delete payload.id;
      delete payload.profilePic;        // media pipeline only
      delete payload.coverPhoto;        // media pipeline only
      delete payload.hasCustomProfilePic;
      delete payload.hasCustomCoverPhoto;

      const profile = await profileService.createProfile(payload, userId);

      return res.status(201).json({
        success: true,
        message: "Profile created successfully",
        data: profile,
      });
    } catch (error) {
      console.error("createProfile error:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          message: "Profile already exists for this user",
        });
      }
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // PUT /api/profiles/me
  async updateMyProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // Strip fields that aren't client-settable via this endpoint
      const payload = { ...req.body };
      delete payload.userId;
      delete payload.id;
      delete payload.profilePic;        // media pipeline only
      delete payload.coverPhoto;        // media pipeline only
      delete payload.hasCustomProfilePic;
      delete payload.hasCustomCoverPhoto;

      const profile = await profileService.updateProfileByUserId(userId, payload);

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: profile,
      });
    } catch (error) {
      console.error("updateMyProfile error:", error);
      const status = error.message?.toLowerCase().includes("not found")
        ? 404
        : error.message?.toLowerCase().includes("invalid")
          ? 400 : 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/profiles/me
  async deleteMyProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      await profileService.deleteProfileByUserId(userId);

      return res.status(200).json({
        success: true,
        message: "Profile deleted successfully",
      });
    } catch (error) {
      console.error("deleteMyProfile error:", error);
      const status = error.message?.toLowerCase().includes("not found") ? 404 : 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ProfileController();