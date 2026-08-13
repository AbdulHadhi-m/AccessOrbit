import { Types, type FilterQuery } from "mongoose";
import { UserModel, type User, type UserStatus } from "../../database/models/index.js";
import { toCaseInsensitiveRegex } from "../../shared/utils/pagination.js";

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  roleIds?: Types.ObjectId[];
  status?: UserStatus;
}

export interface UserListInput {
  page: number;
  limit: number;
  search?: string;
  status?: UserStatus;
  sort: Record<string, 1 | -1>;
}

export interface UserListResult {
  items: Array<Record<string, unknown>>;
  total: number;
}

const ROLE_PROJECTION = "name slug active";

export const userRepository = {
  findById(id: string | Types.ObjectId) {
    return UserModel.findById(id).lean().exec();
  },

  findByIdWithRoles(id: string | Types.ObjectId) {
    return UserModel.findById(id)
      .populate("roleIds", ROLE_PROJECTION)
      .lean()
      .exec();
  },

  async list(input: UserListInput): Promise<UserListResult> {
    const filter: FilterQuery<User> = {};
    if (input.search) {
      const regex = toCaseInsensitiveRegex(input.search);
      filter.$or = [{ name: regex }, { email: regex }];
    }
    if (input.status) {
      filter.status = input.status;
    }
    const [items, total] = await Promise.all([
      UserModel.find(filter)
        .populate("roleIds", ROLE_PROJECTION)
        .sort(input.sort)
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean()
        .exec(),
      UserModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
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

  updateById(id: string | Types.ObjectId, patch: Partial<CreateUserInput>) {
    return UserModel.updateOne({ _id: id }, { $set: patch }).exec();
  },

  async deleteById(id: string | Types.ObjectId) {
    const result = await UserModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  },
};
