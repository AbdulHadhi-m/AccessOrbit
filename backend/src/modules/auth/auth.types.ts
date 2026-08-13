import type { UserStatus } from "../../database/models/index.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roleIds: string[];
  status: UserStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      permissions?: string[];
    }
  }
}