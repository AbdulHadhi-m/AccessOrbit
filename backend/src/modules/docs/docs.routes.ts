import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";

export const docsRouter = Router();

docsRouter.use("/", swaggerUi.serve);
docsRouter.get("/", swaggerUi.setup(openApiDocument));
docsRouter.get("/json", (_req, res) => {
  res.json(openApiDocument);
});