import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { KEBAB_KEY_PATTERN } from "../../shared/utils/slug.js";

export const moduleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    key: {
      type: String,
      required: true,
      trim: true,
      match: KEBAB_KEY_PATTERN,
    },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
    icon: { type: String, default: "" },
  },
  { timestamps: true }
);

moduleSchema.index({ key: 1 }, { unique: true });

export type Module = InferSchemaType<typeof moduleSchema>;
export type ModuleDocument = HydratedDocument<Module>;
export const ModuleModel = model<Module>("Module", moduleSchema);
