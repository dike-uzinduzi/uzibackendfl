const { Profile, User, CorporateProfile } = require("../models");

class ProfileService {

  _userInclude() {
    return {
      model: User,
      attributes: ["id", "userName", "email", "role"],
      include: [
        {
          model: CorporateProfile,
          as: "corporateProfile",         // ← alias from models/index.js
          required: false,
        },
      ],
    };
  }

  async findAllProfiles() {
    return Profile.findAll({
      include: [this._userInclude()],
    });
  }

  async findProfileByUserId(userId) {
    const profile = await Profile.findOne({
      where: { userId },
      include: [this._userInclude()],
    });
    if (!profile) throw new Error("Profile not found");
    return profile;
  }

  async findProfileById(id) {
    const profile = await Profile.findByPk(id, {
      include: [this._userInclude()],
    });
    if (!profile) throw new Error("Profile not found");
    return profile;
  }

  async createProfile(profileData, userId) {
    const profile = await Profile.create({
      ...profileData,
      userId,
    });
    return this.findProfileById(profile.id);
  }

  async updateProfileByUserId(userId, updateData) {
    const profile = await Profile.findOne({
      where: { userId },
      include: [{ model: User, attributes: ["id", "role"] }],
    });

    if (!profile) throw new Error("Profile not found");

    const role = profile.User?.role;

    // Split corporate-only fields from regular profile fields
    const corporateKeys = [
      "companyName", "industry", "csrFocus", "monthlyBudget",
      "logoUrl", "websiteUrl", "officialEmail", "companyBio",
      "taxId", "corpAddress", "socialLinks",
    ];

    const corporateUpdate = {};
    const profileUpdate = { ...updateData };

    for (const key of corporateKeys) {
      if (key in profileUpdate) {
        corporateUpdate[key] = profileUpdate[key];
        delete profileUpdate[key];
      }
    }

    await profile.update(profileUpdate);

    // Update CorporateProfile for corporate role only
    if (role === "corporate" && Object.keys(corporateUpdate).length > 0) {
      const [corp] = await CorporateProfile.findOrCreate({
        where: { userId },
        defaults: {
          userId,
          companyName: "",
          industry: "",
          csrFocus: "",
          monthlyBudget: 0,
          isActive: true,
        },
      });
      await corp.update(corporateUpdate);
    }

    return this.findProfileByUserId(userId);
  }

  async deleteProfileByUserId(userId) {
    const profile = await Profile.findOne({ where: { userId } });
    if (!profile) throw new Error("Profile not found");

    await profile.destroy();

    const user = await User.findByPk(userId);
    if (user) await user.destroy();

    return { message: "Profile and user deleted" };
  }
}

module.exports = new ProfileService();