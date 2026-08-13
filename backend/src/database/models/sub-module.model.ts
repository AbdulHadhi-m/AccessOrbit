import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { KEBAB_KEY_PATTERN } from "../../shared/utils/slug.js";

export const subModuleSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    key: { type: String, required: true, trim: true, match: KEBAB_KEY_PATTERN },
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subModuleSchema.index({ moduleId: 1, key: 1 }, { unique: true });
subModuleSchema.index({ moduleId: 1, order: 1 });

export type SubModule = InferSchemaType<typeof subModuleSchema>;
export type SubModuleDocument = HydratedDocument<SubModule>;
export const SubModuleModel = model<SubModule>("SubModule", subModuleSchema, "sub_modules");
