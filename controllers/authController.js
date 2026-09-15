const authService = require("../services/authService");
const socialService = require("../services/socialService");
class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);

      return res.status(201).json({
        success: true,
        message: result.message,
        token: result.token,
        user: result.user,
        requiresVerification: result.requiresVerification,
      });
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      const statusCode =
        error.message?.toLowerCase().includes("exists") ||
        error.message?.toLowerCase().includes("already") ||
        error.message?.toLowerCase().includes("invalid") ||
        error.message?.toLowerCase().includes("required")
          ? 400
          : 500;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Registration failed",
      });
    }
  }


  async verifyEmail(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: "Email and OTP are required",
        });
      }
      const result = await authService.verifyEmail(email, otp);
      return res.status(200).json({
        success: true,
        message: result.message,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Email verification failed",
      });
    }
  }

  async socialLogin(req, res) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: "idToken is required",
        });
      }

      const profile = await socialService.verifyGoogleIdToken(idToken);
       console.log('SOCIAL PROFILE:', JSON.stringify(profile, null, 2)); 
      const result = await authService.socialLogin(profile);

      return res.status(200).json({
        success: true,
        needsCompletion: result.needsCompletion,
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      console.error("SOCIAL LOGIN ERROR:", error);  
      return res.status(401).json({
        success: false,
        message: error.message || "Social login failed",
      });
    }
  }


  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const result = await authService.resendOTP(email);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("RESEND OTP ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to resend OTP",
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const result = await authService.login(email, password);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      const statusCode =
        error.message?.toLowerCase().includes("invalid") ||
        error.message?.toLowerCase().includes("incorrect") ||
        error.message?.toLowerCase().includes("not found")
          ? 401
          : 500;

      return res.status(statusCode).json({
        success: false,
        message: error.message || "Login failed",
      });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await authService.getCurrentUser(userId);

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("GET CURRENT USER ERROR:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Error retrieving user profile",
      });
    }
  }

  async socialComplete(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const { userName, role } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!userName || !role) {
        return res.status(400).json({
          success: false,
          message: "Username and role are required",
        });
      }

      const result = await authService.socialComplete(userId, {
        userName,
        role,
      });

      return res.status(200).json({
        success: true,
        message: result.message || "Social signup completed successfully",
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      console.error("SOCIAL COMPLETE ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to complete social signup",
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const result = await authService.forgotPassword(email);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("FORGOT PASSWORD ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to process forgot password request",
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Email, OTP, and new password are required",
        });
      }

      const result = await authService.resetPassword(email, otp, newPassword);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to reset password",
      });
    }
  }

  async requestAdminCreationOTP(req, res) {
    try {
      const { userName, email, password } = req.body;

      if (!userName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "Username, email, and password are required",
        });
      }

      const result = await authService.requestAdminCreationOTP(
        { userName, email, password },
        req.user
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("REQUEST ADMIN CREATION OTP ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to request admin creation OTP",
      });
    }
  }

  async verifyAdminCreationOTP(req, res) {
    try {
      const { otp } = req.body;

      if (!otp) {
        return res.status(400).json({
          success: false,
          message: "OTP is required",
        });
      }

      const result = await authService.verifyAdminCreationOTP(otp);

      return res.status(200).json({
        success: true,
        message: result.message,
        user: result.user,
      });
    } catch (error) {
      console.error("VERIFY ADMIN CREATION OTP ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message || "Failed to verify admin creation OTP",
      });
    }
  }
}

module.exports = new AuthController();









