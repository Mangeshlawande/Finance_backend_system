import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '#config/logger.js';

const ACCESS_SECRET  = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const ACCESS_EXPIRY  = process.env.JWT_EXPIRES_IN || '15m';   // short!
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;           // 7 days in ms

export const jwttoken = {
  sign: payload => {
    try {
      return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
    } catch (e) {
      logger.error(`JWT sign error: ${e.message}`);
      throw new Error('Failed to generate token');
    }
  },
  verify: token => {
    try {
      return jwt.verify(token, ACCESS_SECRET);
    } catch (e) {
      logger.error(`JWT verify error: ${e.message}`);
      throw new Error('Failed to authenticate token');
    }
  },
};

export const generateRefreshToken = () => ({
  raw:       crypto.randomUUID(),                // sent to client
  expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
});

export const hashToken = raw =>
  crypto.createHash('sha256').update(raw).digest('hex');  // stored in DB