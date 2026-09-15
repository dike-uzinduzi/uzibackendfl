const { User } = require("../models");
const { Op } = require("sequelize");

class UserService {

  // Only these fields are excluded from every response
  get _privateAttrs() {
    return {
      exclude: ["password"],
    };
  }

  async findAllUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      attributes: this._privateAttrs,
      offset,
      limit: parseInt(limit),
      order: [["createdAt", "DESC"]],
    });

    return {
      users: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  async findUserById(id) {
    const user = await User.findByPk(id, {
      attributes: this._privateAttrs,
    });
    if (!user) throw new Error("User not found");
    return user;
  }

  async createUser(userData, currentUser = null) {
    // ─── Role gate ──────────────────────────────────────────
    const requestedRole = (userData.role || "fan").toLowerCase();

    if (requestedRole === "super_admin") {
      throw new Error("Cannot create super admin accounts via this endpoint");
    }

    if (requestedRole === "admin" || requestedRole === "corporate") {
      if (!currentUser || currentUser.role !== "super_admin") {
        throw new Error("Only super admin can create admin or corporate accounts");
      }
    }

    if (requestedRole === "artist" && currentUser && currentUser.role === "fan") {
      throw new Error("Fans cannot create artist accounts");
    }

    // ─── Conflict check ─────────────────────────────────────
    const conflicting = await User.findAll({
      where: {
        [Op.or]: [{ email: userData.email }, { userName: userData.userName }],
      },
    });

    let emailTaken = false;
    let usernameTaken = false;

    for (const u of conflicting) {
      if (!u.isEmailVerified) {
        // Stale unverified — safe to delete and reuse the email/username
        const { Profile, CorporateProfile, Artist } = require("../models");
        await Profile.destroy({ where: { userId: u.id } });
        await CorporateProfile.destroy({ where: { userId: u.id } });
        await Artist.destroy({ where: { userId: u.id } });
        await u.destroy();
      } else {
        if (u.email === userData.email) emailTaken = true;
        if (u.userName === userData.userName) usernameTaken = true;
      }
    }

    if (emailTaken && usernameTaken) throw new Error("Both this email and username are already taken.");
    if (emailTaken) throw new Error("This email address is already in use.");
    if (usernameTaken) throw new Error("This username is already taken.");

    // ─── Create ─────────────────────────────────────────────
    const isAdmin = requestedRole === "admin" || requestedRole === "super_admin";

    const user = await User.create({
      userName: userData.userName,
      email: String(userData.email).toLowerCase().trim(),
      password: userData.password,
      role: requestedRole,
      isEmailVerified: isAdmin ? true : Boolean(userData.isEmailVerified),
      isDemoAccount: Boolean(userData.isDemoAccount),
    });

    const userResponse = user.get({ plain: true });
    delete userResponse.password;
    return userResponse;
  }

  async updateUser(id, updateData, currentUser) {
    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "super_admin" &&
      currentUser.id !== id
    ) {
      throw new Error("You can only update your own profile");
    }

    if (updateData.role === "super_admin") {
      throw new Error("Cannot assign super admin role");
    }

    if (updateData.role === "admin" && currentUser.role !== "super_admin") {
      throw new Error("Only super admin can assign admin roles");
    }

    // Users can't promote themselves to admin/corporate/artist
    const roleChanging = updateData.role && updateData.role !== currentUser.role;
    const selfEdit = currentUser.id === id;
    const privilegedEdit = currentUser.role === "admin" || currentUser.role === "super_admin";

    if (roleChanging && selfEdit && !privilegedEdit) {
      delete updateData.role;
    }

    // Strip fields nobody should set via this endpoint
    delete updateData.password;
    delete updateData.isDemoAccount;

    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    await user.update(updateData);

    return User.findByPk(id, { attributes: this._privateAttrs });
  }

  async deleteUser(id, currentUser) {
    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "super_admin" &&
      currentUser.id !== id
    ) {
      throw new Error("You can only delete your own profile");
    }

    const user = await User.findByPk(id);
    if (!user) throw new Error("User not found");

    if (user.role === "super_admin") {
      throw new Error("Cannot delete super admin account");
    }

    await user.destroy();
    return user;
  }

  async initializeSuperAdmin() {
    return User.initializeSuperAdmin();
  }
}

module.exports = new UserService();