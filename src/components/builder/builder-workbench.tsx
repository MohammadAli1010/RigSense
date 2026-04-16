"use client";

import Link from "next/link";
import { useState } from "react";

import { saveBuildAction } from "@/actions/builds";
import type { CategoryPath, MockBuild, MockPart } from "@/data/mock-data";
import type { BuildEditorDraft, BuildSelections } from "@/lib/build-editor";
import { emptyBuildSelections } from "@/lib/build-editor";
import { formatPrice, formatSegment, formatSpecValue, formatRelativeTime, isPriceStale } from "@/lib/format";
import { analyzeBuild } from "@/lib/compatibility";

type BuilderWorkbenchProps = {
  parts: MockPart[];
  presets: MockBuild[];
  initialDraft?: BuildEditorDraft;
  status?: string;
};

const slotSections = [
  {
    key: "cpu",
    label: "CPU",
    categoryPath: "cpu",
    required: true,
    helper: "Start with the processor that matches your gaming or creator target.",
  },
  {
    key: "motherboard",
    label: "Motherboard",
    categoryPath: "motherboard",
    required: true,
    helper: "Socket, memory support, and form factor all branch from here.",
  },
  {
    key: "gpu",
    label: "GPU",
    categoryPath: "gpu",
    required: false,
    helper: "Optional for now, but central for gaming-focused rigs.",
  },
  {
    key: "ram",
    label: "RAM",
    categoryPath: "ram",
    required: true,
    helper: "Memory type is checked directly against motherboard support.",
  },
  {
    key: "psu",
    label: "Power Supply",
    categoryPath: "psu",
    required: true,
    helper: "Headroom warnings appear when the selected PSU is too tight.",
  },
  {
    key: "pcCase",
    label: "Case",
    categoryPath: "case",
    required: true,
    helper: "Case selection gates motherboard size and physical clearances.",
  },
  {
    key: "cooler",
    label: "Cooler",
    categoryPath: "cooler",
    required: false,
    helper: "Socket support and air-cooler clearance are both checked.",
  },
] as const;

function getPartsForCategory(parts: MockPart[], categoryPath: CategoryPath) {
  return parts.filter((part) => part.categoryPath === categoryPath);
}

function getPart(parts: MockPart[], slug: string) {
  return parts.find((part) => part.slug === slug);
}

function buildPresetSelections(parts: MockPart[], preset: MockBuild): BuildSelections {
  const nextSelections = { ...emptyBuildSelections };

  for (const slug of preset.partSlugs) {
    const part = getPart(parts, slug);

    if (!part) {
      continue;
    }

    switch (part.categoryPath) {
      case "cpu":
        nextSelections.cpu = part.slug;
        break;
      case "motherboard":
        nextSelections.motherboard = part.slug;
        break;
      case "gpu":
        nextSelections.gpu = part.slug;
        break;
      case "ram":
        nextSelections.ram = part.slug;
        break;
      case "storage":
        if (!nextSelections.primaryStorage) {
          nextSelections.primaryStorage = part.slug;
        } else {
          nextSelections.secondaryStorage = part.slug;
        }
        break;
      case "psu":
        nextSelections.psu = part.slug;
        break;
      case "case":
        nextSelections.pcCase = part.slug;
        break;
      case "cooler":
        nextSelections.cooler = part.slug;
        break;
    }
  }

  return nextSelections;
}

function SelectionCard({
  label,
  helper,
  options,
  required,
  value,
  onChange,
  selectedPart,
  quantity,
}: {
  label: string;
  helper: string;
  options: MockPart[];
  required: boolean;
  value: string;
  onChange: (value: string) => void;
  selectedPart?: MockPart;
  quantity?: {
    value: number;
    onChange: (value: number) => void;
    max: number;
  };
}) {
  const topSpecs = selectedPart ? Object.entries(selectedPart.specs).slice(0, 2) : [];

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{label}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">{helper}</p>
        </div>
        {required ? (
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
            Required
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 mt-5 sm:flex-row sm:items-center">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
        >
          <option value="">Select {label}</option>
          {options.map((part) => (
            <option key={part.slug} value={part.slug}>
              {part.brand} {part.name}
            </option>
          ))}
        </select>
        
        {quantity && value && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-slate-400">Qty:</span>
            <select
              value={quantity.value}
              onChange={(e) => quantity.onChange(parseInt(e.target.value, 10))}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
            >
              {Array.from({ length: quantity.max }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedPart ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">{selectedPart.brand}</p>
              <p className="mt-1 text-base font-semibold text-white">{selectedPart.name}</p>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-sm font-semibold text-cyan-200">
                {quantity ? `${formatPrice(selectedPart.priceCents)} ea` : formatPrice(selectedPart.priceCents)}
              </p>
              {selectedPart.lastUpdated && (
                <p className="mt-1 text-[10px] text-slate-400 flex flex-col items-end">
                  {selectedPart.priceSource && <span>{selectedPart.priceSource}</span>}
                  <span className={isPriceStale(new Date(selectedPart.lastUpdated)) ? "text-amber-400" : ""}>
                    {formatRelativeTime(new Date(selectedPart.lastUpdated))}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {topSpecs.map(([key, specValue]) => (
              <div key={key}>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  {formatSegment(key)}
                </p>
                <p className="mt-1 text-sm text-slate-300">{formatSpecValue(specValue)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getStatusMessage(status?: string) {
  switch (status) {
    case "saved":
      return {
        tone: "info" as const,
        message: "Draft saved. You can keep iterating or complete it once the required slots are ready.",
      };
    case "completed":
      return {
        tone: "success" as const,
        message: "Build marked complete. It remains private until you publish it from the build detail page.",
      };
    case "completion-blocked":
      return {
        tone: "warning" as const,
        message: "The latest draft was saved, but completion was blocked by missing required slots or compatibility errors.",
      };
    case "title-required":
      return {
        tone: "error" as const,
        message: "Add a build title before saving.",
      };
    case "invalid-build-data":
      return {
        tone: "error" as const,
        message: "The builder payload could not be read. Please try again.",
      };
    case "invalid-part-selection":
      return {
        tone: "error" as const,
        message: "One or more selected parts were invalid for this save request.",
      };
    case "seed-parts-required":
      return {
        tone: "error" as const,
        message: "The database does not have the required parts yet. Run the Prisma seed before saving builds.",
      };
    default:
      return null;
  }
}

export function BuilderWorkbench({
  parts,
  presets,
  initialDraft,
  status,
}: BuilderWorkbenchProps) {
  const [title, setTitle] = useState(initialDraft?.title ?? "New RigSense Build");
  const [description, setDescription] = useState(initialDraft?.description ?? "");
  const [selections, setSelections] = useState<BuildSelections>(
    initialDraft?.selections ?? emptyBuildSelections,
  );

  const selectedParts = {
    cpu: getPart(parts, selections.cpu),
    motherboard: getPart(parts, selections.motherboard),
    gpu: getPart(parts, selections.gpu),
    ram: getPart(parts, selections.ram),
    storage: [
      getPart(parts, selections.primaryStorage),
      getPart(parts, selections.secondaryStorage),
    ].filter(Boolean) as MockPart[],
    psu: getPart(parts, selections.psu),
    pcCase: getPart(parts, selections.pcCase),
    cooler: getPart(parts, selections.cooler),
  };

  const analysis = analyzeBuild(selectedParts);
  const selectedCatalogParts = [
    selectedParts.cpu,
    selectedParts.motherboard,
    selectedParts.gpu,
    selectedParts.ram,
    ...selectedParts.storage,
    selectedParts.psu,
    selectedParts.pcCase,
    selectedParts.cooler,
  ].filter(Boolean) as MockPart[];

  const readinessLabel =
    analysis.readiness === "ready"
      ? "Ready to complete"
      : analysis.readiness === "warning"
        ? "Ready with warnings"
        : analysis.readiness === "blocked"
          ? "Blocked by compatibility issues"
          : "Draft in progress";
  const statusMessage = getStatusMessage(status);
  const canRequestCompletion =
    analysis.errors.length === 0 && analysis.requiredSlotsMissing.length === 0;
  const serializedSelections = JSON.stringify(selections);

  return (
    <form action={saveBuildAction} className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 lg:py-24">
      <input type="hidden" name="buildId" value={initialDraft?.id ?? ""} readOnly />
      <input type="hidden" name="selections" value={serializedSelections} readOnly />

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="space-y-5">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
            Builder
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {initialDraft?.id
              ? "Edit your saved build with live compatibility checks."
              : "Assemble a private RigSense build with live compatibility checks."}
          </h1>
          <p className="text-lg leading-8 text-slate-300">
            This builder uses the seeded catalog to validate the most important v1
            rules: CPU and motherboard socket matching, RAM type support, case fit,
            cooler support, physical clearances, and PSU headroom.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Quick presets</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setTitle(preset.title);
                  setDescription(preset.description);
                  setSelections(buildPresetSelections(parts, preset));
                }}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
              >
                Load {preset.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setTitle("New RigSense Build");
                setDescription("");
                setSelections(emptyBuildSelections);
              }}
              className="rounded-full border border-rose-400/25 px-4 py-2 text-sm text-rose-200 transition hover:border-rose-300/40 hover:text-white"
            >
              Reset build
            </button>
          </div>
        </div>
      </section>

      {statusMessage ? (
        <p
          className={
            statusMessage.tone === "success"
              ? "rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm leading-7 text-emerald-100"
              : statusMessage.tone === "warning"
                ? "rounded-[2rem] border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm leading-7 text-amber-100"
                : statusMessage.tone === "error"
                  ? "rounded-[2rem] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm leading-7 text-rose-100"
                  : "rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm leading-7 text-cyan-100"
          }
        >
          {statusMessage.message}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.75fr]">
        <label className="space-y-2 text-sm text-slate-200">
          <span className="font-medium">Build title</span>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
            placeholder="Weekend 1440p Rig"
            required
          />
        </label>
        <label className="space-y-2 text-sm text-slate-200">
          <span className="font-medium">Build notes</span>
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
            placeholder="High-refresh gaming focus, quiet airflow target, and upgrade headroom."
          />
        </label>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          {slotSections.map((slot) => (
            <SelectionCard
              key={slot.key}
              label={slot.label}
              helper={slot.helper}
              options={getPartsForCategory(parts, slot.categoryPath)}
              required={slot.required}
              value={selections[slot.key]}
              onChange={(value) =>
                setSelections((current: BuildSelections) => ({
                  ...current,
                  [slot.key]: value,
                }))
              }
              selectedPart={selectedParts[slot.key as keyof typeof selectedParts] as MockPart}
              quantity={slot.key === "ram" ? {
                value: selections.ramQuantity,
                onChange: (v) => setSelections((curr: BuildSelections) => ({ ...curr, ramQuantity: v })),
                max: 4
              } : undefined}
            />
          ))}

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Storage</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  One storage device is required. A second drive is optional and counts toward price and wattage.
                </p>
              </div>
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
                Required
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-200">Primary drive</p>
                <select
                  value={selections.primaryStorage}
                  onChange={(event) =>
                    setSelections((current: BuildSelections) => ({
                      ...current,
                      primaryStorage: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
                >
                  <option value="">Select primary storage</option>
                  {getPartsForCategory(parts, "storage").map((part) => (
                    <option key={`primary-${part.slug}`} value={part.slug}>
                      {part.brand} {part.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-200">Secondary drive</p>
                <select
                  value={selections.secondaryStorage}
                  onChange={(event) =>
                    setSelections((current: BuildSelections) => ({
                      ...current,
                      secondaryStorage: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
                >
                  <option value="">No secondary drive</option>
                  {getPartsForCategory(parts, "storage").map((part) => (
                    <option key={`secondary-${part.slug}`} value={part.slug}>
                      {part.brand} {part.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedParts.storage.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {selectedParts.storage.map((part, index) => (
                <div
                  key={part.slug}
                  className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <p className="text-sm text-slate-400">{index === 0 ? "Primary" : "Secondary"}</p>
                  <p className="mt-1 text-base font-semibold text-white">{part.name}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-sm font-semibold text-cyan-200">
                      {formatPrice(part.priceCents)}
                    </p>
                    {part.lastUpdated && (
                      <p className="text-[10px] text-slate-400 flex flex-col items-end">
                        {part.priceSource && <span>{part.priceSource}</span>}
                        <span className={isPriceStale(new Date(part.lastUpdated)) ? "text-amber-400" : ""}>
                          {formatRelativeTime(new Date(part.lastUpdated))}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Readiness</p>
              <p className="mt-4 text-2xl font-semibold text-white">{readinessLabel}</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Compatibility</p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {analysis.compatibilityStatus}
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Price</p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {formatPrice(analysis.totalPriceCents)}
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Estimated wattage</p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {analysis.estimatedWattage}W
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Required slots</p>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              {["CPU", "Motherboard", "RAM", "Storage", "PSU", "Case"].map((slot) => (
                <div key={slot} className="flex items-center justify-between gap-4">
                  <span>{slot}</span>
                  <span>
                    {analysis.requiredSlotsMissing.includes(slot) ? "Missing" : "Ready"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Compatibility report</p>
            <div className="mt-5 space-y-4">
              {analysis.errors.length === 0 && analysis.warnings.length === 0 ? (
                <p className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm leading-7 text-emerald-100">
                  No compatibility issues detected with the current selections.
                </p>
              ) : null}

              {analysis.errors.map((issue) => (
                <div
                  key={issue.message}
                  className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm leading-7 text-rose-100"
                >
                  <p className="font-semibold">{issue.message}</p>
                  {issue.remedy && <p className="mt-2 text-rose-200/80">{issue.remedy}</p>}
                </div>
              ))}

              {analysis.warnings.map((issue) => (
                <div
                  key={issue.message}
                  className="rounded-3xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm leading-7 text-amber-100"
                >
                  <p className="font-semibold">{issue.message}</p>
                  {issue.remedy && <p className="mt-2 text-amber-200/80">{issue.remedy}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Current part list</p>
              <Link
                href="/builds"
                className="text-sm text-cyan-200 transition hover:text-cyan-100"
              >
                My builds
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {selectedCatalogParts.length > 0 ? (
                selectedCatalogParts.map((part, index) => (
                  <div
                    key={`${part.categoryPath}-${part.slug}`}
                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-slate-400">{formatSegment(part.categoryPath)}</p>
                      <p className="text-sm font-medium text-white">{part.name}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-semibold text-cyan-200">
                        {formatPrice(part.priceCents)}
                      </p>
                      {part.lastUpdated && (
                        <p className="text-[10px] text-slate-400 flex flex-col items-end">
                          {part.priceSource && <span>{part.priceSource}</span>}
                          <span className={isPriceStale(new Date(part.lastUpdated)) ? "text-amber-400" : ""}>
                            {formatRelativeTime(new Date(part.lastUpdated))}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-3xl border border-dashed border-white/10 px-4 py-5 text-sm leading-7 text-slate-400">
                  Start selecting components to build out the current draft.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-dashed border-white/10 p-6 text-sm leading-7 text-slate-400">
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="intent"
                value="save"
                className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {initialDraft?.id ? "Update draft" : "Save draft"}
              </button>
              <button
                type="submit"
                name="intent"
                value="complete"
                disabled={!canRequestCompletion}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark complete
              </button>
            </div>
            <p className="mt-5">
              Completed builds stay private until you choose to publish them from the build detail page.
            </p>
          </div>
        </div>
      </section>
    </form>
  );
}
