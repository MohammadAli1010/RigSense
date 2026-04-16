import { BuildSlot } from "@prisma/client";
import { z } from "zod";

export const buildSelectionsSchema = z.object({
  cpu: z.string().optional().default(""),
  motherboard: z.string().optional().default(""),
  gpu: z.string().optional().default(""),
  ram: z.string().optional().default(""),
  ramQuantity: z.number().int().min(1).max(4).optional().default(1),
  primaryStorage: z.string().optional().default(""),
  secondaryStorage: z.string().optional().default(""),
  psu: z.string().optional().default(""),
  pcCase: z.string().optional().default(""),
  cooler: z.string().optional().default(""),
});

export type BuildSelections = z.infer<typeof buildSelectionsSchema>;

export const emptyBuildSelections: BuildSelections = {
  cpu: "",
  motherboard: "",
  gpu: "",
  ram: "",
  ramQuantity: 1,
  primaryStorage: "",
  secondaryStorage: "",
  psu: "",
  pcCase: "",
  cooler: "",
};

export type BuildEditorDraft = {
  id?: string;
  title: string;
  description: string;
  selections: BuildSelections;
};

export function parseBuildSelections(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    const result = buildSelectionsSchema.safeParse(parsed);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function getBuildSelectionSlugs(selections: BuildSelections) {
  return [
    selections.cpu,
    selections.motherboard,
    selections.gpu,
    selections.ram,
    selections.primaryStorage,
    selections.secondaryStorage,
    selections.psu,
    selections.pcCase,
    selections.cooler,
  ].filter(Boolean);
}

export function buildPartsToSelections(
  parts: Array<{ slot: BuildSlot; quantity?: number; part: { slug: string } }>,
): BuildSelections {
  const selections = { ...emptyBuildSelections };

  for (const item of parts) {
    switch (item.slot) {
      case BuildSlot.CPU:
        selections.cpu = item.part.slug;
        break;
      case BuildSlot.MOTHERBOARD:
        selections.motherboard = item.part.slug;
        break;
      case BuildSlot.GPU:
        selections.gpu = item.part.slug;
        break;
      case BuildSlot.RAM:
        selections.ram = item.part.slug;
        if (item.quantity) selections.ramQuantity = item.quantity;
        break;
      case BuildSlot.STORAGE:
        if (!selections.primaryStorage) {
          selections.primaryStorage = item.part.slug;
        } else {
          selections.secondaryStorage = item.part.slug;
        }
        break;
      case BuildSlot.PSU:
        selections.psu = item.part.slug;
        break;
      case BuildSlot.CASE:
        selections.pcCase = item.part.slug;
        break;
      case BuildSlot.COOLER:
        selections.cooler = item.part.slug;
        break;
    }
  }

  return selections;
}
