import type { MockPart } from "@/data/mock-data";

export type BuilderSelectionParts = {
  cpu?: MockPart;
  motherboard?: MockPart;
  gpu?: MockPart;
  ram?: MockPart;
  ramQuantity?: number;
  storage: MockPart[];
  psu?: MockPart;
  pcCase?: MockPart;
  cooler?: MockPart;
};

export type CompatibilityIssue = {
  message: string;
  remedy: string;
};

export type BuildAnalysis = {
  compatibilityStatus: "OK" | "WARNING" | "ERROR";
  readiness: "draft" | "blocked" | "warning" | "ready";
  errors: CompatibilityIssue[];
  warnings: CompatibilityIssue[];
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

// Modular compatibility rules
function checkSockets(parts: BuilderSelectionParts, errors: CompatibilityIssue[]) {
  const cpuSocket = getStringSpec(parts.cpu, "socket");
  const motherboardSocket = getStringSpec(parts.motherboard, "socket");

  if (cpuSocket && motherboardSocket && cpuSocket !== motherboardSocket) {
    errors.push({
      message: `CPU socket ${cpuSocket} does not match motherboard socket ${motherboardSocket}.`,
      remedy: "Swap either the CPU or the Motherboard so their socket types match.",
    });
  }
}

function checkRam(parts: BuilderSelectionParts, errors: CompatibilityIssue[]) {
  const ramType = getStringSpec(parts.ram, "type");
  const motherboardRamType = getStringSpec(parts.motherboard, "ramType");

  if (ramType && motherboardRamType && ramType !== motherboardRamType) {
    errors.push({
      message: `RAM type ${ramType} does not match motherboard memory support ${motherboardRamType}.`,
      remedy: `Choose memory that uses the ${motherboardRamType} standard supported by your motherboard.`,
    });
  }
}

function checkFormFactor(parts: BuilderSelectionParts, errors: CompatibilityIssue[]) {
  const motherboardFormFactor = getStringSpec(parts.motherboard, "formFactor");
  const supportedFormFactors = getStringArraySpec(parts.pcCase, "supportedFormFactors");

  if (
    motherboardFormFactor &&
    supportedFormFactors.length > 0 &&
    !supportedFormFactors.includes(motherboardFormFactor)
  ) {
    errors.push({
      message: `Case support (${supportedFormFactors.join(", ")}) does not include the motherboard form factor ${motherboardFormFactor}.`,
      remedy: "Pick a larger case or a smaller motherboard so they fit together physically.",
    });
  }
}

function checkCoolerSockets(parts: BuilderSelectionParts, errors: CompatibilityIssue[]) {
  const cpuSocket = getStringSpec(parts.cpu, "socket");
  const coolerSupportedSockets = getStringArraySpec(parts.cooler, "supportedSockets");

  if (
    parts.cooler &&
    cpuSocket &&
    coolerSupportedSockets.length > 0 &&
    !coolerSupportedSockets.includes(cpuSocket)
  ) {
    errors.push({
      message: `Selected cooler does not list support for the CPU socket ${cpuSocket}.`,
      remedy: "Find a cooler that includes mounting hardware for your processor's socket.",
    });
  }
}

function checkPhysicalClearances(parts: BuilderSelectionParts, errors: CompatibilityIssue[]) {
  const gpuLength = getNumericSpec(parts.gpu, "lengthMm");
  const maxGpuLength = getNumericSpec(parts.pcCase, "maxGpuLengthMm");

  if (gpuLength && maxGpuLength && gpuLength > maxGpuLength) {
    errors.push({
      message: `GPU length ${gpuLength}mm exceeds case clearance of ${maxGpuLength}mm.`,
      remedy: "Select a shorter graphics card or a case with more GPU clearance.",
    });
  }

  const coolerHeight = getNumericSpec(parts.cooler, "heightMm");
  const maxCoolerHeight = getNumericSpec(parts.pcCase, "maxCoolerHeightMm");

  if (coolerHeight && maxCoolerHeight && coolerHeight > maxCoolerHeight) {
    errors.push({
      message: `Cooler height ${coolerHeight}mm exceeds case CPU cooler clearance of ${maxCoolerHeight}mm.`,
      remedy: "Choose a lower-profile cooler or a wider case.",
    });
  }
}

function calculateWattageAndCheckPsu(parts: BuilderSelectionParts, errors: CompatibilityIssue[], warnings: CompatibilityIssue[]): number {
  const cpuTdp = getNumericSpec(parts.cpu, "tdp") ?? 0;
  const gpuTdp = getNumericSpec(parts.gpu, "tdp") ?? 0;
  const motherboardDraw = parts.motherboard ? 55 : 0;
  const ramDraw = parts.ram ? 12 * (parts.ramQuantity || 1) : 0;
  const storageDraw = parts.storage.length * 8;
  const coolingDraw = parts.cooler ? 10 : 0;
  const chassisDraw = parts.pcCase ? 12 : 0;

  const estimatedWattage = Math.ceil(
    (cpuTdp + gpuTdp + motherboardDraw + ramDraw + storageDraw + coolingDraw + chassisDraw) / 5
  ) * 5;

  const psuWattage = getNumericSpec(parts.psu, "wattage");

  if (psuWattage) {
    if (estimatedWattage > psuWattage) {
      errors.push({
        message: `Estimated draw of ${estimatedWattage}W is above the PSU capacity of ${psuWattage}W.`,
        remedy: "Upgrade to a power supply with higher wattage.",
      });
    } else if (estimatedWattage > psuWattage * 0.8) {
      warnings.push({
        message: `PSU headroom is slim. ${estimatedWattage}W on a ${psuWattage}W unit leaves limited upgrade margin.`,
        remedy: "Consider a larger power supply to ensure stability and future upgrade paths.",
      });
    }
  }

  return estimatedWattage;
}

function checkGeneralWarnings(parts: BuilderSelectionParts, warnings: CompatibilityIssue[]) {
  if (parts.cpu && !parts.cooler) {
    warnings.push({
      message: "No CPU cooler selected yet.",
      remedy: "Add a cooler before treating the build as final to ensure safe CPU temperatures.",
    });
  }

  if (!parts.gpu) {
    warnings.push({
      message: "No dedicated GPU selected.",
      remedy: "That can still be valid, but gaming and benchmark expectations will differ.",
    });
  }
}

export function analyzeBuild(parts: BuilderSelectionParts): BuildAnalysis {
  const errors: CompatibilityIssue[] = [];
  const warnings: CompatibilityIssue[] = [];
  const requiredSlotsMissing: string[] = [];

  if (!parts.cpu) requiredSlotsMissing.push("CPU");
  if (!parts.motherboard) requiredSlotsMissing.push("Motherboard");
  if (!parts.ram) requiredSlotsMissing.push("RAM");
  if (parts.storage.length === 0) requiredSlotsMissing.push("Storage");
  if (!parts.psu) requiredSlotsMissing.push("PSU");
  if (!parts.pcCase) requiredSlotsMissing.push("Case");

  checkSockets(parts, errors);
  checkRam(parts, errors);
  checkFormFactor(parts, errors);
  checkCoolerSockets(parts, errors);
  checkPhysicalClearances(parts, errors);
  const estimatedWattage = calculateWattageAndCheckPsu(parts, errors, warnings);
  checkGeneralWarnings(parts, warnings);

  const totalPriceCents = [
    parts.cpu,
    parts.motherboard,
    parts.gpu,
    parts.psu,
    parts.pcCase,
    parts.cooler,
    ...parts.storage,
  ]
    .filter((part): part is MockPart => Boolean(part))
    .reduce((total, part) => total + part.priceCents, 0) + 
    (parts.ram ? parts.ram.priceCents * (parts.ramQuantity || 1) : 0);

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
