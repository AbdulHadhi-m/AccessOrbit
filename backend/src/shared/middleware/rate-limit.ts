import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";
import { HttpStatus } from "../constants/http.js";
import { sendFailure } from "../utils/response.js";

const skipInTests = () => env.NODE_ENV === "test";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: skipInTests,
  handler: (req, res) => {
    void req;
    sendFailure(
      res,
      HttpStatus.TOO_MANY_REQUESTS,
      "RATE_LIMITED",
      "Too many requests, please try again later"
    );
  },
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: skipInTests,
  handler: (req, res) => {
    void req;
    sendFailure(
      res,
      HttpStatus.TOO_MANY_REQUESTS,
      "RATE_LIMITED",
      "Too many attempts, please try again later"
    );
  },
});