import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { decrBy, exists, expire, incBy } from "../services/index.js";
import { successResponse } from "./success.response.js";
import geoip from "geoip-lite";

const fromWhere = (ip) => {
  if (!ip) return null;
  return geoip.lookup(ip)?.country;
};

export const generateLimiter = ({
  ttl = 15 * 60,
  limit = 100,
  skipSuccessfulRequests = false,
  skipFailedRequests = false,
  // legagacyHeaders = true,
  standardHeaders = "draft-8",
  statusCode = 429,
  message = "Too many requests, please try again later",
  allowedCountries = ["EG"],
}) => {
  return rateLimit({
    windowMs: ttl * 1000,
    // legagacyHeaders,
    standardHeaders,
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req, res, next) => {
      return successResponse({ res, status: statusCode, message });
    },
    limit: (req) => {
      const country = fromWhere(req.ip);
      return allowedCountries.includes(country) ? limit : 0;
    },
    keyGenerator: (req) => {
      const ip = ipKeyGenerator(req.ip, 52);
      return `${ip}::${req.path}`;
    },
    store: {
      async incr(key, callback) {
        try {
          const count = await incBy({ key });

          if (count === 1) {
            await expire({ key, ttl });
          }

          callback(null, count);
        } catch (error) {
          callback(error);
        }
      },
      async decrement(key) {
        if (await exists({ key })) {
          await decrBy({ key });
        }
      },
    },
  });
};
