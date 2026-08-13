import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { KEBAB_KEY_PATTERN } from "../../shared/utils/slug.js";

export const operationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    key: { type: String, required: true, trim: true, match: KEBAB_KEY_PATTERN },
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true },
    subModuleId: { type: Schema.Types.ObjectId, ref: "SubModule", default: null },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

operationSchema.index({ moduleId: 1, subModuleId: 1, key: 1 }, { unique: true });
operationSchema.index({ subModuleId: 1 });

export type Operation = InferSchemaType<typeof operationSchema>;
export type OperationDocument = HydratedDocument<Operation>;
export const OperationModel = model<Operation>("Operation", operationSchema);
