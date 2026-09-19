export const E2E_URLS = {
  api: process.env.E2E_API_URL ?? "http://localhost:3000",
  frontend: process.env.E2E_FRONTEND_URL ?? "http://localhost:5173",
  admin: process.env.E2E_ADMIN_URL ?? "http://localhost:5174",
  manager: process.env.E2E_MANAGER_URL ?? "http://localhost:5175",
} as const;

export const E2E_USERS = {
  admin: {
    name: "E2E Admin",
    email: "admin.e2e@example.com",
    password: "Password123!",
  },
  user: {
    name: "E2E User",
    email: "user.e2e@example.com",
    password: "Password123!",
  },
  competitionOwner: {
    name: "E2E Competition Owner",
    email: "competition-owner.e2e@example.com",
    password: "Password123!",
  },
  unverifiedUser: {
    name: "E2E Unverified User",
    email: "unverified-user.e2e@example.com",
    password: "Password123!",
  },
  staff: {
    name: "E2E Staff",
    email: "staff.e2e@example.com",
    password: "Password123!",
  },
  member: {
    name: "E2E Member",
    email: "member.e2e@example.com",
    password: "Password123!",
  },
  secondOwner: {
    name: "E2E Second Owner",
    email: "second-owner.e2e@example.com",
    password: "Password123!",
  },
} as const;

export const E2E_AUTH_FILES = {
  admin: "playwright/.auth/admin.json",
  user: "playwright/.auth/user.json",
  competitionOwner: "playwright/.auth/competition-owner.json",
  unverifiedUser: "playwright/.auth/unverified-user.json",
  staff: "playwright/.auth/staff.json",
  member: "playwright/.auth/member.json",
  secondOwner: "playwright/.auth/second-owner.json",
} as const;
