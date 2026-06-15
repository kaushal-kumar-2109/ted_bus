const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "redbus_jwt_secret_change_in_production";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "redbus_refresh_secret_change_in_production";
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || "30d";

/**
 * Generate access token
 * @param {Object} payload - {userId, email, role}
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

/**
 * Generate refresh token
 * @param {Object} payload - {userId}
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE });
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

/**
 * Build token response object
 */
const buildTokenResponse = (user) => {
  const payload = { userId: user._id, email: user.email, role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ userId: user._id }),
    expiresIn: JWT_EXPIRE,
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  buildTokenResponse,
};
