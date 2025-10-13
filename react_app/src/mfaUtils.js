// mfaUtils.js - Utility functions for MFA
import crypto from "crypto";

// Generate 6-digit MFA code
export const generateMFACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate session token
export const generateSessionToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// In-memory storage for MFA codes (use Redis in production)
export const mfaCodes = new Map();
