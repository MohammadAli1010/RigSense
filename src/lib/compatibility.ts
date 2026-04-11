import type { MockPart } from "@/data/mock-data";

export type BuilderSelectionParts = {
  cpu?: MockPart;
  motherboard?: MockPart;
  gpu?: MockPart;
  ram?: MockPart;
  storage: MockPart[];
  psu?: MockPart;
  pcCase?: MockPart;
  cooler?: MockPart;
};

export type BuildAnalysis = {
  compatibilityStatus: "OK" | "WARNING" | "ERROR";
  readiness: "draft" | "blocked" | "warning" | "ready";
  errors: string[];
  warnings: string[];
  requiredSlotsMissing: string[];
  estimatedWattage: number;
  totalPriceCents: number;
};

function getNumericSpec(part: MockPart | undefined, key: string) {
  const value = part?.specs[key];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/\d+/);

    if (match) {
      return Number(match[0]);
    }
  }

  return undefined;
}

function getStringSpec(part: MockPart | undefined, key: string) {
  const value = part?.specs[key];

  return typeof value === "string" ? value : undefined;
}

function getStringArraySpec(part: MockPart | undefined, key: string) {
  const value = part?.specs[key];

  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}

export function analyzeBuild(parts: BuilderSelectionParts): BuildAnalysis {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredSlotsMissing: string[] = [];

  if (!parts.cpu) {
    requiredSlotsMissing.push("CPU");
  }

  if (!parts.motherboard) {
    requiredSlotsMissing.push("Motherboard");
  }

  if (!parts.ram) {
    requiredSlotsMissing.push("RAM");
  }

  if (parts.storage.length === 0) {
    requiredSlotsMissing.push("Storage");
  }

  if (!parts.psu) {
    requiredSlotsMissing.push("PSU");
  }

  if (!parts.pcCase) {
    requiredSlotsMissing.push("Case");
  }

  const cpuSocket = getStringSpec(parts.cpu, "socket");
  const motherboardSocket = getStringSpec(parts.motherboard, "socket");

  if (cpuSocket && motherboardSocket && cpuSocket !== motherboardSocket) {
    errors.push(`CPU socket ${cpuSocket} does not match motherboard socket ${motherboardSocket}.`);
  }

  const ramType = getStringSpec(parts.ram, "type");
  const motherboardRamType = getStringSpec(parts.motherboard, "ramType");

  if (ramType && motherboardRamType && ramType !== motherboardRamType) {
    errors.push(`RAM type ${ramType} does not match motherboard memory support ${motherboardRamType}.`);
  }

  const motherboardFormFactor = getStringSpec(parts.motherboard, "formFactor");
  const supportedFormFactors = getStringArraySpec(parts.pcCase, "supportedFormFactors");

  if (
    motherboardFormFactor &&
    supportedFormFactors.length > 0 &&
    !supportedFormFactors.includes(motherboardFormFactor)
  ) {
    errors.push(
      `Case support (${supportedFormFactors.join(", ")}) does not include the motherboard form factor ${motherboardFormFactor}.`,
    );
  }

  const coolerSupportedSockets = getStringArraySpec(parts.cooler, "supportedSockets");

  if (
    parts.cooler &&
    cpuSocket &&
    coolerSupportedSockets.length > 0 &&
    !coolerSupportedSockets.includes(cpuSocket)
  ) {
    errors.push(`Selected cooler does not list support for the CPU socket ${cpuSocket}.`);
  }

  const gpuLength = getNumericSpec(parts.gpu, "lengthMm");
  const maxGpuLength = getNumericSpec(parts.pcCase, "maxGpuLengthMm");

  if (gpuLength && maxGpuLength && gpuLength > maxGpuLength) {
    errors.push(`GPU length ${gpuLength}mm exceeds case clearance of ${maxGpuLength}mm.`);
  }

  const coolerHeight = getNumericSpec(parts.cooler, "heightMm");
  const maxCoolerHeight = getNumericSpec(parts.pcCase, "maxCoolerHeightMm");

  if (coolerHeight && maxCoolerHeight && coolerHeight > maxCoolerHeight) {
    errors.push(
      `Cooler height ${coolerHeight}mm exceeds case CPU cooler clearance of ${maxCoolerHeight}mm.`,
    );
  }

  const cpuTdp = getNumericSpec(parts.cpu, "tdp") ?? 0;
  const gpuTdp = getNumericSpec(parts.gpu, "tdp") ?? 0;
  const motherboardDraw = parts.motherboard ? 55 : 0;
  const ramDraw = parts.ram ? 12 : 0;
  const storageDraw = parts.storage.length * 8;
  const coolingDraw = parts.cooler ? 10 : 0;
  const chassisDraw = parts.pcCase ? 12 : 0;

  const estimatedWattage = Math.ceil(
    (cpuTdp + gpuTdp + motherboardDraw + ramDraw + storageDraw + coolingDraw + chassisDraw) /
      5,
  ) * 5;

  const psuWattage = getNumericSpec(parts.psu, "wattage");

  if (psuWattage) {
    if (estimatedWattage > psuWattage) {
      errors.push(
        `Estimated draw of ${estimatedWattage}W is above the PSU capacity of ${psuWattage}W.`,
      );
    } else if (estimatedWattage > psuWattage * 0.8) {
      warnings.push(
        `PSU headroom is slim. ${estimatedWattage}W on a ${psuWattage}W unit leaves limited upgrade margin.`,
      );
    }
  }

  if (parts.cpu && !parts.cooler) {
    warnings.push("No CPU cooler selected yet. Add one before treating the build as final.");
  }

  if (!parts.gpu) {
    warnings.push(
      "No dedicated GPU selected. That can still be valid, but gaming and benchmark expectations will differ.",
    );
  }

  const totalPriceCents = [
    parts.cpu,
    parts.motherboard,
    parts.gpu,
    parts.ram,
    parts.psu,
    parts.pcCase,
    parts.cooler,
    ...parts.storage,
  ]
    .filter((part): part is MockPart => Boolean(part))
    .reduce((total, part) => total + part.priceCents, 0);

  let readiness: BuildAnalysis["readiness"] = "ready";

  if (requiredSlotsMissing.length > 0) {
    readiness = "draft";
  } else if (errors.length > 0) {
    readiness = "blocked";
  } else if (warnings.length > 0) {
    readiness = "warning";
  }

  const compatibilityStatus: BuildAnalysis["compatibilityStatus"] =
    errors.length > 0 ? "ERROR" : warnings.length > 0 ? "WARNING" : "OK";

  return {
    compatibilityStatus,
    readiness,
    errors,
    warnings,
    requiredSlotsMissing,
    estimatedWattage,
    totalPriceCents,
  };
}
