import type { UserRole } from "@/generated/prisma/enums";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult =
  | {
      success: true;
      user: AuthUser;
    }
  | {
      success: false;
      error: string;
    };