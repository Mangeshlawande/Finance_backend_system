import jwt from "jsonwebtoken"
import logger from "#config/logger.js"


const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const jwttoken = {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (e) {
      logger.error(`JWT sign error: ${e.message}`);
      throw new Error('Failed to generate token');
    }
  },
  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      logger.error(`JWT verify error: ${e.message}`);
      throw new Error('Failed to authenticate token');
    }
  },
};
