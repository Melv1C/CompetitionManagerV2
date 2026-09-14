export const E2E_URLS = {
  backend: "http://localhost:3000",
  frontend: "http://localhost:5173",
  admin: "http://localhost:5174",
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
} as const;

export const E2E_AUTH_FILES = {
  admin: "playwright/.auth/admin.json",
  user: "playwright/.auth/user.json",
} as const;
