import type { RequestHandler } from "express";
import { HttpStatus } from "../constants/http.js";
import { sendFailure } from "../utils/response.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  sendFailure(
    res,
    HttpStatus.NOT_FOUND,
    "NOT_FOUND",
    `Route ${req.method} ${req.originalUrl} does not exist`
  );
};