import bcrypt from "bcryptjs";

const PASSWORD_ROUNDS = 12;
export const DUMMY_PASSWORD_HASH = "$2b$12$FgjAFrH/UfP3dZmirzyAYujHszfIh/HyunLLfzigVSIfS7zMDcqU6";

export function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
