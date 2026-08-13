import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { PERMISSION_KEY_PATTERN } from "../../shared/utils/slug.js";

export const rolePermissionSchema = new Schema(
  {
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    permissionKey: { type: String, required: true, trim: true, match: PERMISSION_KEY_PATTERN },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

rolePermissionSchema.index({ roleId: 1, enabled: 1 });
rolePermissionSchema.index({ roleId: 1, permissionKey: 1 }, { unique: true });
rolePermissionSchema.index({ permissionKey: 1 });

export type RolePermission = InferSchemaType<typeof rolePermissionSchema>;
export type RolePermissionDocument = HydratedDocument<RolePermission>;
export const RolePermissionModel = model<RolePermission>(
  "RolePermission",
  rolePermissionSchema,
  "role_permissions"
);
