import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

export const AUDIT_STATUSES = ["success", "failure"] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export const auditLogSchema = new Schema(
  {
    actor: {
      id: { type: Schema.Types.ObjectId, ref: "User", index: true },
      email: { type: String, trim: true, lowercase: true },
      name: { type: String, trim: true },
    },
    action: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    targetId: { type: String, index: true },
    targetType: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: AUDIT_STATUSES, default: "success", index: true },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    requestId: { type: String, default: "" },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ "actor.id": 1, createdAt: -1 });

export type AuditLog = InferSchemaType<typeof auditLogSchema>;
export type AuditLogDocument = HydratedDocument<AuditLog>;
export const AuditLogModel = model<AuditLog>("AuditLog", auditLogSchema);
