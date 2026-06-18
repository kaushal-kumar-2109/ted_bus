const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/customer");
const { buildTokenResponse, verifyRefreshToken } = require("../utils/generateToken");
const { success, created, error, validationError } = require("../utils/apiResponse");
const { authLimiter } = require("../middleware/rateLimiter");
const { verifyToken } = require("../middleware/auth");
const { sendEmail } = require("../utils/mailer");

// ──────────────────────────────────────────────
// POST /auth/register
// ──────────────────────────────────────────────
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, dateOfBirth, gender } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return validationError(res, "Please provide all required fields", [
        "firstName", "lastName", "email", "phone", "password",
      ]);
    }

    if (password.length < 6) {
      return validationError(res, "Password must be at least 6 characters");
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      return validationError(res, "Invalid Indian phone number");
    }

    const [emailExists, phoneExists] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ phone }),
    ]);

    if (emailExists) return error(res, "Email is already registered", 409);
    if (phoneExists) return error(res, "Phone number is already registered", 409);

    const emailToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      emailVerificationToken: emailToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000,
    });

    await newUser.save();

    const tokens = buildTokenResponse(newUser);

    return created(res, {
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        isEmailVerified: newUser.isEmailVerified,
        canPostContent: newUser.canPostContent,
      },
      ...tokens,
    }, "Registration successful! Please verify your email.");
  } catch (err) {
    return error(res, "Registration failed", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /auth/login
// ──────────────────────────────────────────────
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return validationError(res, "Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password +loginAttempts +lockUntil");
    if (!user) return error(res, "Invalid email or password", 401);

    if (user.isLocked()) {
      return error(res, "Account temporarily locked due to too many failed attempts. Try again in 2 hours.", 423);
    }

    if (user.isBanned) {
      return error(res, `Account suspended: ${user.banReason}`, 403);
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      await user.incrementLoginAttempts();
      return error(res, "Invalid email or password", 401);
    }

    // Reset login attempts on success
    await user.updateOne({ $set: { loginAttempts: 0, lastLogin: new Date() }, $unset: { lockUntil: 1 } });

    const tokens = buildTokenResponse(user);

    return success(res, {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isProfileVerified: user.isProfileVerified,
        canPostContent: user.canPostContent,
        profilePicture: user.profilePicture,
        verificationStatus: user.verificationStatus,
      },
      ...tokens,
    }, "Login successful");
  } catch (err) {
    return error(res, "Login failed", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /auth/refresh
// ──────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return validationError(res, "Refresh token is required");

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);
    if (!user) return error(res, "User not found", 404);

    const tokens = buildTokenResponse(user);
    return success(res, tokens, "Token refreshed");
  } catch (err) {
    return error(res, "Invalid or expired refresh token", 401);
  }
});

// ──────────────────────────────────────────────
// GET /auth/verify-email/:token
// ──────────────────────────────────────────────
router.get("/verify-email/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpire: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpire");

    if (!user) return error(res, "Verification link is invalid or has expired", 400);

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    return success(res, {}, "Email verified successfully! You can now log in.");
  } catch (err) {
    return error(res, "Email verification failed", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /auth/forgot-password
// ──────────────────────────────────────────────
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return validationError(res, "Email is required");

    const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpire");

    // Always return success to avoid user enumeration
    if (!user) {
      return success(res, {}, "If that email exists, a reset link has been sent.");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send real email with reset link
    const resetUrl = `${process.env.APP_URL || "http://localhost:4200"}/reset-password/${resetToken}`;
    
    sendEmail({
      to: email,
      subject: "RedBus Clone - Reset Your Password",
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; rounded-2xl;">
          <h2 style="color: #d02b2b; text-align: center;">Reset Your Password</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your RedBus Clone account. Click the button below to choose a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #d02b2b; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 8px;">Reset Password</a>
          </div>
          <p>If you did not make this request, you can safely ignore this email.</p>
          <p>Best regards,<br>The RedBus Clone Team</p>
        </div>
      `
    }).catch(err => {
      console.error("Forgot password SMTP failure:", err);
    });

    return success(res, {}, "Password reset link has been sent to your email.");
  } catch (err) {
    return error(res, "Forgot password failed", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// POST /auth/reset-password/:token
// ──────────────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return validationError(res, "Password must be at least 6 characters");
    }

    const user = await User.findOne({
      passwordResetToken: req.params.token,
      passwordResetExpire: { $gt: Date.now() },
    }).select("+password +passwordResetToken +passwordResetExpire");

    if (!user) return error(res, "Password reset link is invalid or has expired", 400);

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    user.loginAttempts = 0;
    await user.save();

    return success(res, {}, "Password reset successful. You can now log in.");
  } catch (err) {
    return error(res, "Password reset failed", 500, err.message);
  }
});

// ──────────────────────────────────────────────
// GET /auth/me
// ──────────────────────────────────────────────
router.get("/me", verifyToken, async (req, res) => {
  return success(res, { user: req.user }, "Profile fetched");
});

// ──────────────────────────────────────────────
// PUT /auth/change-password
// ──────────────────────────────────────────────
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return validationError(res, "Current and new passwords are required");
    }
    if (newPassword.length < 6) {
      return validationError(res, "New password must be at least 6 characters");
    }

    const user = await User.findById(req.userId).select("+password");
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) return error(res, "Current password is incorrect", 400);

    user.password = newPassword;
    await user.save();

    return success(res, {}, "Password changed successfully");
  } catch (err) {
    return error(res, "Password change failed", 500, err.message);
  }
});

module.exports = router;
