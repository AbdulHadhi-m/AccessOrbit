import { Types } from "mongoose";
import { UserModel, type UserStatus } from "../../database/models/index.js";

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  roleIds?: Types.ObjectId[];
  status?: UserStatus;
}

export const userRepository = {
  findById(id: string | Types.ObjectId) {
    return UserModel.findById(id).lean().exec();
  },

  findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() }).lean().exec();
  },

  findByEmailWithPassword(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() }).select("+passwordHash").lean().exec();
  },

  updateLastLogin(id: string | Types.ObjectId) {
    return UserModel.updateOne({ _id: id }, { $set: { lastLoginAt: new Date() } }).exec();
  },

  create(input: CreateUserInput) {
    return UserModel.create(input);
  },

  async upsertByEmail(input: CreateUserInput) {
    const email = input.email.toLowerCase();
    const existing = await UserModel.findOne({ email }).exec();
    if (existing) {
      await UserModel.updateOne(
        { _id: existing._id },
        {
          $set: { passwordHash: input.passwordHash, roleIds: input.roleIds ?? [], status: "active" },
        }
      ).exec();
      return existing._id;
    }
    const created = await UserModel.create({ ...input, email, status: "active" });
    return created._id;
  },

  countByRole(roleId: string | Types.ObjectId) {
    return UserModel.countDocuments({ roleIds: roleId }).exec();
  },

  setStatus(id: string | Types.ObjectId, status: UserStatus) {
    return UserModel.updateOne({ _id: id }, { $set: { status } }).exec();
  },

  setRoles(id: string | Types.ObjectId, roleIds: Types.ObjectId[]) {
    return UserModel.updateOne({ _id: id }, { $set: { roleIds } }).exec();
  },
};
