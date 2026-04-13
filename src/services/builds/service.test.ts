import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, analyticsMock, errorReportingMock, loggerMock } = vi.hoisted(() => ({
  prismaMock: {
    part: {
      findMany: vi.fn(),
    },
    build: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    buildPart: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
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

import { saveBuild, toggleBuildVisibility } from "@/services/builds/service";

const completeSelections = {
  cpu: "amd-ryzen-7-9800x3d",
  motherboard: "asus-rog-strix-b850-a",
  gpu: "nvidia-rtx-5070-ti-founders",
  ram: "gskill-trident-z5-32gb-6000",
  primaryStorage: "samsung-990-pro-2tb",
  secondaryStorage: "",
  psu: "corsair-rm850x-shift",
  pcCase: "lian-li-lancool-216",
  cooler: "deepcool-assassin-iv",
} as const;

describe("build service", () => {
  beforeEach(() => {
    prismaMock.part.findMany.mockReset();
    prismaMock.build.findUnique.mockReset();
    prismaMock.build.create.mockReset();
    prismaMock.build.update.mockReset();
    prismaMock.build.findMany.mockReset();
    prismaMock.buildPart.deleteMany.mockReset();
    prismaMock.buildPart.createMany.mockReset();
  });

  it("rejects invalid part selections before hitting the database", async () => {
    const result = await saveBuild({
      userId: "user-1",
      title: "Invalid build",
      description: "",
      requestedCompletion: false,
      selections: {
        ...completeSelections,
        cpu: "unknown-part",
      },
    });

    expect(result).toEqual({
      status: "invalid-part-selection",
    });
    expect(prismaMock.part.findMany).not.toHaveBeenCalled();
  });

  it("returns completion-blocked when required slots or compatibility block completion", async () => {
    prismaMock.part.findMany.mockResolvedValue([
      {
        id: "part-cpu",
        slug: "amd-ryzen-7-9800x3d",
      },
    ]);
    prismaMock.build.findUnique.mockResolvedValue(null);
    prismaMock.build.create.mockResolvedValue({
      id: "build-1",
    });
    prismaMock.buildPart.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.buildPart.createMany.mockResolvedValue({ count: 1 });

    const result = await saveBuild({
      userId: "user-1",
      title: "Incomplete build",
      description: "",
      requestedCompletion: true,
      selections: {
        ...completeSelections,
        motherboard: "",
        gpu: "",
        ram: "",
        primaryStorage: "",
        psu: "",
        pcCase: "",
        cooler: "",
      },
    });

    expect(result).toEqual({
      status: "completion-blocked",
      buildId: "build-1",
    });
  });

  it("blocks saving over another user's build", async () => {
    prismaMock.part.findMany.mockResolvedValue(
      Object.values(completeSelections)
        .filter(Boolean)
        .map((slug, index) => ({ id: `part-${index}`, slug })),
    );
    prismaMock.build.findUnique.mockResolvedValue({
      id: "build-1",
      userId: "someone-else",
    });

    const result = await saveBuild({
      buildId: "build-1",
      userId: "user-1",
      title: "Attempted overwrite",
      description: "",
      requestedCompletion: false,
      selections: completeSelections,
    });

    expect(result).toEqual({
      status: "forbidden",
    });
  });

  it("saves a complete build successfully", async () => {
    prismaMock.part.findMany.mockResolvedValue(
      Object.values(completeSelections)
        .filter(Boolean)
        .map((slug, index) => ({ id: `part-${index}`, slug })),
    );
    prismaMock.build.findUnique.mockResolvedValue(null);
    prismaMock.build.create.mockResolvedValue({
      id: "build-1",
    });
    prismaMock.buildPart.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.buildPart.createMany.mockResolvedValue({ count: 8 });

    const result = await saveBuild({
      userId: "user-1",
      title: "Finished build",
      description: "",
      requestedCompletion: true,
      selections: completeSelections,
    });

    expect(result).toEqual({
      status: "completed",
      buildId: "build-1",
    });
  });

  it("toggles visibility for completed builds", async () => {
    prismaMock.build.findUnique.mockResolvedValue({
      id: "build-1",
      userId: "user-1",
      status: "COMPLETED",
      visibility: "PRIVATE",
    });
    prismaMock.build.update.mockResolvedValue({
      id: "build-1",
      visibility: "PUBLIC",
    });

    const result = await toggleBuildVisibility("build-1", "user-1");

    expect(result).toEqual({
      status: "published",
      buildId: "build-1",
    });
    expect(prismaMock.build.update).toHaveBeenCalledTimes(1);
  });
});
