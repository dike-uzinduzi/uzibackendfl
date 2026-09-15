const userService = require("../services/userService");
const { User, CorporateProfile, Profile } = require("../models");

class UserController {

  async getAllUsers(req, res) {
    try {
      const page = Number.parseInt(req.query.page, 10) || 1;
      const limit = Number.parseInt(req.query.limit, 10) || 10;

      const result = await userService.findAllUsers(page, limit);

      return res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("getAllUsers error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await userService.findUserById(req.params.id);
      const plain = user.get({ plain: true });

      // Strip private fields for non-self, non-admin viewers
      const isSelf = req.user.id === req.params.id;
      const isAdmin = ["admin", "super_admin"].includes(req.user.role);
      if (!isSelf && !isAdmin) {
        delete plain.email;
        delete plain.fcmTokens;
        delete plain.lastLoginAt;
        delete plain.oauthProvider;
        delete plain.oauthProviderId;
      }

      return res.status(200).json({ success: true, data: plain });
    } catch (error) {
      console.error("getUserById error:", error);
      const status = error.message?.toLowerCase().includes("not found") ? 404 : 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  async createUser(req, res) {
    try {
      // Role gate for admin/corporate/super_admin
      const isAdmin = ["admin", "super_admin"].includes(req.user.role);
      const requestedRole = (req.body.role || "fan").toLowerCase();

      if (!isAdmin && ["admin", "super_admin", "corporate"].includes(requestedRole)) {
        return res.status(403).json({
          success: false,
          message: `Only super admin can create ${requestedRole} accounts`,
        });
      }

      const user = await userService.createUser(req.body, req.user);

      // Corporate role needs a CorporateProfile row
      if (user.role === "corporate") {
        await CorporateProfile.findOrCreate({
          where: { userId: user.id },
          defaults: {
            userId: user.id,
            companyName: "",
            industry: "",
            csrFocus: "",
            monthlyBudget: 0,
            isActive: true,
          },
        });
      }

      // Every user gets a Profile row
      await Profile.findOrCreate({
        where: { userId: user.id },
        defaults: {
          userId: user.id,
          firstName: user.userName,
          lastName: "",
          contactEmail: user.email,
        },
      });

      // Admin-created users are pre-verified by default — no OTP.
      // If the caller wants OTP verification, they should use /api/auth/register.

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      console.error("createUser error:", error);

      if (
        error.code === 11000 ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        return res.status(400).json({
          success: false,
          message: "Username or email already exists",
        });
      }

      const status =
        error.message?.toLowerCase().includes("required") ||
        error.message?.toLowerCase().includes("invalid") ||
        error.message?.toLowerCase().includes("exists")
          ? 400
          : error.message?.toLowerCase().includes("not found")
            ? 404
            : error.message?.toLowerCase().includes("only")
              ? 403
              : 500;

      return res.status(status).json({ success: false, message: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user);
      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      console.error("updateUser error:", error);
      const status =
        error.message === "User not found" ? 404
        : error.message.includes("You can only") ? 403
        : 400;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      await userService.deleteUser(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("deleteUser error:", error);
      const status =
        error.message === "User not found" ? 404
        : error.message.includes("You can only") ? 403
        : 500;
      return res.status(status).json({ success: false, message: error.message });
    }
  }

  async notifyUser(req, res) {
    try {
      const { id } = req.params;
      const { type } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (type === "login_reminder") {
        await emailService.sendLoginReminder(user.email, user.userName);
        return res.status(200).json({ success: true, message: "Login reminder sent" });
      }

      if (type === "verification_fix") {
        if (user.isEmailVerified) {
          return res.status(400).json({ success: false, message: "User is already verified." });
        }

        // OTP now lives in OtpToken
        const { OtpToken } = require("../models");
        const otpService = require("../services/otpService");

        const otp = await otpService.issueOtp(user.email, "email_verification", {
          resend: true,
        });

        await emailService.sendVerificationFix(user.email, user.userName, otp);

        return res.status(200).json({ success: true, message: "Verification instructions sent" });
      }

      return res.status(400).json({ success: false, message: "Invalid notification type" });
    } catch (error) {
      console.error("notifyUser error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new UserController();