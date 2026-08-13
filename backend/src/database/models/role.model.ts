import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { KEBAB_KEY_PATTERN } from "../../shared/utils/slug.js";

export const roleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      trim: true,
      match: KEBAB_KEY_PATTERN,
    },
    description: { type: String, default: "" },
    isSystem: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

roleSchema.index({ slug: 1 }, { unique: true });

export type Role = InferSchemaType<typeof roleSchema>;
export type RoleDocument = HydratedDocument<Role>;
export const RoleModel = model<Role>("Role", roleSchema);
