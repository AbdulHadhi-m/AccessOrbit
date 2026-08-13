import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";

export const docsRouter = Router();

const customCss = `
  /* AccessOrbit Modern Dark Swagger Theme */
  :root {
    --ao-bg: #0b0f19;
    --ao-surface: #111827;
    --ao-card: #1f2937;
    --ao-border: rgba(139, 92, 246, 0.2);
    --ao-primary: #7c3aed;
    --ao-primary-hover: #6d28d9;
    --ao-text: #f3f4f6;
    --ao-muted: #9ca3af;
  }

  body {
    background-color: var(--ao-bg) !important;
    color: var(--ao-text) !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  }

  .swagger-ui {
    color: var(--ao-text) !important;
  }

  .swagger-ui .topbar {
    background-color: #0f172a !important;
    border-bottom: 1px solid rgba(124, 58, 237, 0.3) !important;
    padding: 12px 0 !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
  }

  .swagger-ui .topbar .download-url-wrapper {
    display: none !important;
  }

  .swagger-ui .info {
    margin: 30px 0 !important;
  }

  .swagger-ui .info .title {
    color: #ffffff !important;
    font-weight: 800 !important;
    font-size: 32px !important;
    letter-spacing: -0.02em !important;
  }

  .swagger-ui .info .title small {
    background-color: #7c3aed !important;
    border-radius: 8px !important;
    padding: 3px 10px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #ffffff !important;
    margin-left: 12px !important;
    vertical-align: middle !important;
  }

  .swagger-ui .info .title small.version-stamp {
    background-color: #4c1d95 !important;
  }

  .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table {
    color: #cbd5e1 !important;
    font-size: 14px !important;
    line-height: 1.6 !important;
  }

  .swagger-ui .info code {
    background: rgba(124, 58, 237, 0.15) !important;
    color: #c4b5fd !important;
    border: 1px solid rgba(124, 58, 237, 0.3) !important;
    border-radius: 4px !important;
    padding: 2px 6px !important;
  }

  .swagger-ui .scheme-container {
    background-color: #111827 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 14px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    padding: 16px 20px !important;
    margin-bottom: 24px !important;
  }

  .swagger-ui .schemes > label {
    color: #94a3b8 !important;
    font-weight: 600 !important;
  }

  .swagger-ui select {
    background-color: #1e293b !important;
    color: #f8fafc !important;
    border: 1px solid rgba(124, 58, 237, 0.3) !important;
    border-radius: 8px !important;
    padding: 6px 12px !important;
  }

  .swagger-ui .btn.authorize {
    background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35) !important;
    transition: all 0.2s ease !important;
    padding: 8px 18px !important;
  }

  .swagger-ui .btn.authorize:hover {
    background: linear-gradient(135deg, #6d28d9, #5b21b6) !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 18px rgba(124, 58, 237, 0.5) !important;
  }

  .swagger-ui .btn.authorize svg {
    fill: #ffffff !important;
  }

  .swagger-ui .opblock-tag {
    color: #f8fafc !important;
    font-size: 18px !important;
    font-weight: 700 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    padding: 14px 0 !important;
    margin: 16px 0 8px 0 !important;
  }

  .swagger-ui .opblock-tag small {
    color: #94a3b8 !important;
    font-weight: 400 !important;
    font-size: 13px !important;
  }

  .swagger-ui .opblock {
    background: #111827 !important;
    border-radius: 12px !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
    margin-bottom: 12px !important;
    transition: border-color 0.2s ease, transform 0.15s ease !important;
  }

  .swagger-ui .opblock:hover {
    border-color: rgba(124, 58, 237, 0.4) !important;
  }

  .swagger-ui .opblock .opblock-summary {
    padding: 10px 16px !important;
  }

  .swagger-ui .opblock .opblock-summary-method {
    border-radius: 6px !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    min-width: 70px !important;
    text-shadow: none !important;
  }

  /* Method Color Overrides */
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background-color: #0284c7 !important;
    color: #ffffff !important;
  }
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background-color: #7c3aed !important;
    color: #ffffff !important;
  }
  .swagger-ui .opblock.opblock-patch .opblock-summary-method {
    background-color: #d97706 !important;
    color: #ffffff !important;
  }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background-color: #dc2626 !important;
    color: #ffffff !important;
  }

  .swagger-ui .opblock-summary-path {
    color: #f1f5f9 !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 14px !important;
    font-weight: 600 !important;
  }

  .swagger-ui .opblock-summary-description {
    color: #94a3b8 !important;
    font-size: 13px !important;
  }

  .swagger-ui .opblock .opblock-section-header {
    background: #1e293b !important;
    box-shadow: none !important;
    border-radius: 8px !important;
  }

  .swagger-ui .opblock-section-header h4 {
    color: #e2e8f0 !important;
  }

  .swagger-ui .opblock-description-wrapper p,
  .swagger-ui .opblock-external-docs-wrapper p,
  .swagger-ui .opblock-title_normal p {
    color: #cbd5e1 !important;
  }

  .swagger-ui table thead tr th,
  .swagger-ui table thead tr td {
    color: #94a3b8 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  }

  .swagger-ui table.parameters {
    border-collapse: separate !important;
  }

  .swagger-ui .parameter__name {
    color: #f1f5f9 !important;
    font-family: monospace !important;
    font-weight: 600 !important;
  }

  .swagger-ui .parameter__type {
    color: #a78bfa !important;
  }

  .swagger-ui .parameter__in {
    color: #64748b !important;
  }

  .swagger-ui .responses-inner {
    background: #0f172a !important;
    padding: 16px !important;
    border-radius: 10px !important;
  }

  .swagger-ui .response-col_status {
    color: #38bdf8 !important;
    font-weight: 700 !important;
  }

  .swagger-ui .response-col_description__inner div {
    color: #cbd5e1 !important;
  }

  .swagger-ui .highlight-code,
  .swagger-ui .microlight {
    background: #0b0f19 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 8px !important;
    color: #e2e8f0 !important;
  }

  .swagger-ui section.models {
    background-color: #111827 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 14px !important;
  }

  .swagger-ui section.models h4 {
    color: #f8fafc !important;
    font-size: 16px !important;
    font-weight: 700 !important;
  }

  .swagger-ui .model-box {
    background-color: #1e293b !important;
    border-radius: 8px !important;
  }

  .swagger-ui .model-title {
    color: #a78bfa !important;
  }

  .swagger-ui .model {
    color: #cbd5e1 !important;
  }

  .swagger-ui .prop-type {
    color: #38bdf8 !important;
  }

  .swagger-ui .filter .operation-filter-input {
    background-color: #1e293b !important;
    border: 1px solid rgba(124, 58, 237, 0.3) !important;
    border-radius: 8px !important;
    color: #f8fafc !important;
    padding: 8px 14px !important;
    margin: 16px 0 !important;
  }

  .swagger-ui .dialog-ux .modal-ux {
    background-color: #0f172a !important;
    border: 1px solid rgba(124, 58, 237, 0.4) !important;
    border-radius: 14px !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8) !important;
  }

  .swagger-ui .dialog-ux .modal-ux-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  }

  .swagger-ui .dialog-ux .modal-ux-header h3 {
    color: #f8fafc !important;
  }

  .swagger-ui .dialog-ux .modal-ux-content h4 {
    color: #cbd5e1 !important;
  }

  .swagger-ui .auth-container input[type="text"] {
    background-color: #1e293b !important;
    border: 1px solid rgba(124, 58, 237, 0.3) !important;
    border-radius: 8px !important;
    color: #f8fafc !important;
  }
`;

const swaggerOptions = {
  customCss,
  customSiteTitle: "AccessOrbit API Documentation",
  customfavIcon:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236B38C3'/%3E%3Cstop offset='100%25' stop-color='%237C3AED'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='8' fill='url(%23g)'/%3E%3Cpath d='M16 8.5c-3.5 1.2-5.5.2-5.5.2v5.8c0 4.2 2.9 6.3 6.4 7.5 3.5-1.2 6.4-3.3 6.4-7.5V8.7s-2 1-5.5-.2z' fill='rgba(255,255,255,0.18)' stroke='%23ffffff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='m13.5 15.5 2 2 4-4' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: "list",
    filter: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
  },
};

docsRouter.use("/", swaggerUi.serve);
docsRouter.get("/", swaggerUi.setup(openApiDocument, swaggerOptions));
docsRouter.get("/json", (_req, res) => {
  res.json(openApiDocument);
});