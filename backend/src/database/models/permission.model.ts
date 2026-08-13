import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { PERMISSION_KEY_PATTERN } from "../../shared/utils/slug.js";

export const permissionSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, match: PERMISSION_KEY_PATTERN },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
    description: { type: String, default: "" },
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true },
    operationId: { type: Schema.Types.ObjectId, ref: "Operation", required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

permissionSchema.index({ key: 1 }, { unique: true });
permissionSchema.index({ moduleId: 1 });

export type Permission = InferSchemaType<typeof permissionSchema>;
export type PermissionDocument = HydratedDocument<Permission>;
export const PermissionModel = model<Permission>("Permission", permissionSchema);
