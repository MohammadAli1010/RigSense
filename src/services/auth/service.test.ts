import { hash } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, analyticsMock, errorReportingMock, loggerMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
  analyticsMock: {
    track: vi.fn(),
  },
  errorReportingMock: {
    captureException: vi.fn(),
  },
  loggerMock: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/analytics", () => ({
  analytics: analyticsMock,
}));

vi.mock("@/lib/error-reporting", () => ({
  errorReporting: errorReportingMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: loggerMock,
}));

import { authenticateUserByPassword, registerUserAccount } from "@/services/auth/service";

describe("auth service", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
    prismaMock.user.create.mockReset();
  });

  it("registers a user when the email is available", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-1",
      name: "Ali",
      email: "ali@example.com",
    });

    const result = await registerUserAccount({
      name: "Ali",
      email: "ali@example.com",
      password: "Password123",
    });

    expect(result).toEqual({
      status: "created",
      user: {
        id: "user-1",
        name: "Ali",
        email: "ali@example.com",
      },
    });
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
  });

  it("rejects registration when the email already exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
    });

    const result = await registerUserAccount({
      name: "Ali",
      email: "ali@example.com",
      password: "Password123",
    });

    expect(result).toEqual({
      status: "email-taken",
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("authenticates valid credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Ali",
      email: "ali@example.com",
      passwordHash: await hash("Password123", 4),
    });

    const result = await authenticateUserByPassword("ali@example.com", "Password123");

    expect(result).toEqual({
      id: "user-1",
      name: "Ali",
      email: "ali@example.com",
    });
  });

  it("returns null for invalid credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Ali",
      email: "ali@example.com",
      passwordHash: await hash("Password123", 4),
    });

    const result = await authenticateUserByPassword("ali@example.com", "WrongPassword1");

    expect(result).toBeNull();
  });
});
