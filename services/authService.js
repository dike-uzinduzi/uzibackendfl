const { User, Profile, CorporateProfile } = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwtUtils");
const otpService = require("./otpService");
const emailService = require("./emailService");

class AuthService {

  async register({ userName, email, password, role }) {
    if (role === "admin" || role === "super_admin" || role === "corporate") {
      throw new Error("This role cannot be self-registered");
    }

    // Wipe any unverified user squatting on this email/username
    const conflicting = await User.findAll({
      where: { [Op.or]: [{ email }, { userName }] },
    });

    let emailTaken = false;
    let usernameTaken = false;

    for (const u of conflicting) {
      if (!u.isEmailVerified) {
        await Profile.destroy({ where: { userId: u.id } });
        await CorporateProfile.destroy({ where: { userId: u.id } });
        await u.destroy();
      } else {
        if (u.email === email) emailTaken = true;
        if (u.userName === userName) usernameTaken = true;
      }
    }

    if (emailTaken && usernameTaken) throw new Error("Both this email and username are already taken.");
    if (emailTaken) throw new Error("This email address is already in use.");
    if (usernameTaken) throw new Error("This username is already taken.");

    const user = await User.create({
      userName,
      email,
      password,
      role: role || "fan",
      isEmailVerified: false,
    });

    const otp = await otpService.issueOtp(email, "email_verification");
    const emailSent = await emailService.sendOTPEmail(email, otp, userName);

    const token = generateToken(user.id);
    const userResponse = user.get({ plain: true });
    delete userResponse.password;

    return {
      user: userResponse,
      token,
      requiresVerification: true,
      message: emailSent
        ? "Registration successful! OTP sent to your email."
        : "Registration successful but failed to send OTP email. Please try verifying later.",
    };
  }

  async verifyEmail(email, otp) {
    await otpService.consumeOtp(email, "email_verification", otp);

    const user = await User.findOne({ where: { email: String(email).toLowerCase().trim() } });
    if (!user) throw new Error("Invalid or expired OTP");

    user.isEmailVerified = true;
    await user.save();

    // Create the appropriate profile
    if (user.role === "corporate") {
      const existing = await CorporateProfile.findOne({ where: { userId: user.id } });
      if (!existing) {
        await CorporateProfile.create({
          userId: user.id,
          companyName: user.userName || "",
          officialEmail: user.email,
          verifiedAt: new Date(),
        });
      }
    } else {
      const existing = await Profile.findOne({ where: { userId: user.id } });
      if (!existing) {
        await Profile.create({
          userId: user.id,
          firstName: user.userName,
          lastName: "Pending",
          contactEmail: user.email,
        });
      }
    }

    await emailService.sendWelcomeEmail(user.email, user.userName);

    const token = generateToken(user.id);
    const userResponse = user.get({ plain: true });
    delete userResponse.password;

    return {
      user: userResponse,
      token,
      message: "Email verified successfully! Welcome to UZI Music!",
    };
  }

  async resendOTP(email) {
    const user = await User.findOne({
      where: { email: String(email).toLowerCase().trim(), isEmailVerified: false },
    });
    if (!user) throw new Error("User not found or already verified");

    const otp = await otpService.issueOtp(email, "email_verification");
    const sent = await emailService.sendOTPEmail(email, otp, user.userName);

    return {
      message: sent
        ? "OTP sent successfully to your email"
        : "Failed to send OTP email",
    };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ where: { email: String(email).toLowerCase().trim() } });

    // Always return the same message — no enumeration
    const sameResponse = { message: "If an account exists with that email, an OTP has been sent." };
    if (!user) return sameResponse;

    // OAuth-only user — no password to reset
    if (!user.password) return sameResponse;

    const otp = await otpService.issueOtp(email, "password_reset");
    await emailService.sendPasswordResetOTPEmail(email, otp, user.userName);
    return sameResponse;
  }

  async resetPassword(email, otp, newPassword) {
    await otpService.consumeOtp(email, "password_reset", otp);

    const user = await User.findOne({ where: { email: String(email).toLowerCase().trim() } });
    if (!user) throw new Error("Invalid or expired OTP");

    user.password = newPassword;   // model hook hashes
    user.passwordChangedAt = new Date();
    await user.save();

    return { message: "Password reset successfully" };
  }

  async requestAdminCreationOTP(adminData, requestedBy) {
    const { userName, email, password } = adminData;

    const existing = await User.findOne({
      where: { [Op.or]: [{ email }, { userName }] },
    });
    if (existing) throw new Error("User with this email or username already exists");

    // Find the super admin issuing the request (never the seeder)
    const superAdmin = await User.findOne({ where: { role: "super_admin" } });
    if (!superAdmin) throw new Error("Super admin not found");

    // The password in meta is hashed at creation time by the User hook,
    // but we hash it now anyway so it never sits in plaintext anywhere.
    const passwordHash = await bcrypt.hash(password, 12);

    const otp = await otpService.issueOtp(superAdmin.email, "admin_creation", {
      userName,
      email,
      passwordHash,
      role: "admin",
      requestedBy: requestedBy.userName,
    });

    const sent = await emailService.sendAccountCreationOTPEmail(
      superAdmin.email,
      otp,
      userName,
      email
    );

    return {
      message: sent
        ? "OTP sent to super admin for admin account creation verification"
        : "Failed to send OTP to super admin",
    };
  }

  async verifyAdminCreationOTP(otp) {
    // Find the super admin — purpose is admin_creation, email is super admin's
    const superAdmin = await User.findOne({ where: { role: "super_admin" } });
    if (!superAdmin) throw new Error("Invalid or expired OTP");

    const token = await otpService.consumeOtp(superAdmin.email, "admin_creation", otp);
    const data = token.meta;
    if (!data) throw new Error("No pending admin creation data found");

    // Create the admin. Password is already hashed — pass it through the hook's bypass.
    const user = await User.create({
      userName: data.userName,
      email: data.email,
      password: data.passwordHash,   // hook detects $2a$ prefix, skips re-hashing
      role: "admin",
      isEmailVerified: true,
    });

    await Profile.create({
      userId: user.id,
      firstName: user.userName,
      lastName: "Admin",
      contactEmail: user.email,
    });

    const userResponse = user.get({ plain: true });
    delete userResponse.password;

    return { user: userResponse, message: "Admin account created successfully" };
  }
  // =========================
  // LOGIN
  // =========================
  async login(email, password) {
    const user = await User.findOne({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!user) throw new Error("Invalid email or password");

    // OAuth-only account — no password to compare
    if (!user.password) {
      throw new Error(
        "This account uses social login. Please continue with Google."
      );
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error("Invalid email or password");

    // Gate on email verification for self-serve roles
    const requiresVerification = [
      "fan", "artist", "producer", "artist_manager", "promoter", "corporate",
    ];
    if (requiresVerification.includes(user.role) && !user.isEmailVerified) {
      throw new Error("Please verify your email address before logging in");
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user.id);
    const userResponse = user.get({ plain: true });
    delete userResponse.password;

    return { user: userResponse, token };
  }

  // =========================
  // CURRENT USER
  // =========================
  async getCurrentUser(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    if (!user) throw new Error("User not found");
    return user;
  }
  // ─── Social signup completion ───────────────────────────────
  async socialComplete(userId, { userName, role }) {
    if (!userId) throw new Error("Unauthorized");

    if (["admin", "super_admin", "corporate"].includes(role)) {
      throw new Error("Cannot set role to admin, super admin, or corporate");
    }

    const user = await User.findByPk(userId);
    if (!user) throw new Error("User not found");

    const cleanUserName = String(userName || "").trim();
    if (!/^[a-zA-Z0-9._-]{3,20}$/.test(cleanUserName)) {
      throw new Error("Username must be 3-20 chars (letters, numbers, dot, dash, underscore)");
    }

    const taken = await User.findOne({
      where: { userName: cleanUserName, id: { [Op.ne]: user.id } },
    });
    if (taken) throw new Error("This username is already taken.");

    user.userName = cleanUserName;
    user.role = role || user.role || "fan";
    user.oauthNeedsCompletion = false;
    await user.save();

    const existingProfile = await Profile.findOne({ where: { userId: user.id } });
    if (!existingProfile) {
      await Profile.create({
        userId: user.id,
        firstName: user.userName,
        lastName: "Pending",
        contactEmail: user.email,
      });
    }

    const token = generateToken(user.id);
    const userResponse = user.get({ plain: true });
    delete userResponse.password;

    return {
      user: userResponse,
      token,
      message: "Social signup completed successfully",
    };
  }

  // ─── Social login (new) ─────────────────────────────────────
async socialLogin(profile) {
  console.log('[socialLogin] START', profile.email);

  const { provider, providerId, email } = profile;
  const normalisedEmail = String(email).toLowerCase().trim();

  // 1. Look up by provider+id first
  console.log('[socialLogin] lookup by provider:', provider, providerId);
  let user = await User.findOne({
    where: { oauthProvider: provider, oauthProviderId: providerId },
  });
  console.log('[socialLogin] provider lookup done, found:', user ? user.id : 'none');

  // 2. If not found, look up by email
  if (!user) {
    console.log('[socialLogin] lookup by email:', normalisedEmail);
    user = await User.findOne({ where: { email: normalisedEmail } });
    console.log('[socialLogin] email lookup done, found:', user ? user.id : 'none');
  }

  // ─── Existing user: sign in (and link provider if not linked) ───
  if (user) {
    console.log('[socialLogin] updating existing user');
    user.oauthProvider = provider;
    user.oauthProviderId = providerId;
    user.isEmailVerified = true;
    user.lastLoginAt = new Date();

    console.log('[socialLogin] saving user...');
    await user.save();
    console.log('[socialLogin] user saved');

    const token = generateToken(user.id);
    console.log('[socialLogin] token generated, returning');

    const userResponse = user.get({ plain: true });
    delete userResponse.password;

    return { needsCompletion: false, user: userResponse, token };
  }

  // ─── New user: create stub + return signup_pending ───
  console.log('[socialLogin] creating NEW user');
  const tempUserName = `_pending_${provider}_${Date.now()}`;

  user = await User.create({
    userName: tempUserName,
    email: normalisedEmail,
    password: null,
    role: "fan",
    isEmailVerified: true,
    oauthProvider: provider,
    oauthProviderId: providerId,
    oauthNeedsCompletion: true,
    lastLoginAt: new Date(),
  });
  console.log('[socialLogin] new user created:', user.id);

  const { generateSignupPendingToken } = require("../utils/jwtUtils");
  const token = generateSignupPendingToken(user.id, provider);

  const userResponse = user.get({ plain: true });
  delete userResponse.password;

  return { needsCompletion: true, user: userResponse, token };
}
}

module.exports = new AuthService();