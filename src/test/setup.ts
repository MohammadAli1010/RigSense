import { afterEach, vi } from "vitest";

Object.assign(process.env, {
  NODE_ENV: "test",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "test-secret",
  AUTH_URL: process.env.AUTH_URL ?? "http://localhost:3000",
  DATABASE_URL:
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/rigsense",
  DIRECT_DATABASE_URL:
    process.env.DIRECT_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/rigsense",
  SHADOW_DATABASE_URL:
    process.env.SHADOW_DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5433/rigsense_shadow",
});

afterEach(() => {
  vi.clearAllMocks();
});
