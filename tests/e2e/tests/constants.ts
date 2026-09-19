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
    name: "E2E Regional Competition Operations Staff Member",
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

export const E2E_CATALOG_IDS = {
  discipline: "20000000-0000-4000-8000-000000000001",
  secondaryOrganizationDiscipline: "20000000-0000-4000-8000-000000000099",
  athleteCategory: "30000000-0000-4000-8000-000000000001",
  secondaryOrganizationAthleteCategory: "30000000-0000-4000-8000-000000000099",
} as const;

export const E2E_ORGANIZATION_LOGOS = {
  primary:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230f766e'/%3E%3Cpath d='M13 42c10-17 24-24 39-21M16 49c10-15 22-20 37-18' fill='none' stroke='%23ccfbf1' stroke-width='5' stroke-linecap='round'/%3E%3Ccircle cx='20' cy='18' r='5' fill='%23f0fdfa'/%3E%3C/svg%3E",
  secondary:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%231e3a8a'/%3E%3Cpath d='M14 43h36M18 35h28M23 27h18' fill='none' stroke='%23dbeafe' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M32 13l6 8H26z' fill='%23eff6ff'/%3E%3C/svg%3E",
} as const;
