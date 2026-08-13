import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";

export const USER_STATUSES = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: { type: String, required: true, select: false },
    roleIds: [{ type: Schema.Types.ObjectId, ref: "Role" }],
    status: { type: String, enum: USER_STATUSES, default: "active", index: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;
export const UserModel = model<User>("User", userSchema);
