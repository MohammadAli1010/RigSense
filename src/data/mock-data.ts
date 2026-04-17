import {
  BenchmarkKind,
  BuildStatus,
  BuildVisibility,
  CompatibilityStatus,
  PartCategory,
} from "@prisma/client";

export type CategoryPath =
  | "cpu"
  | "motherboard"
  | "gpu"
  | "ram"
  | "storage"
  | "psu"
  | "case"
  | "cooler";

export type MockPart = {
  slug: string;
  category: PartCategory;
  categoryPath: CategoryPath;
  brand: string;
  name: string;
  description: string;
  priceCents: number;
  priceSource?: string; // Source of pricing data (API, SCRAPING, MANUAL, etc.)
  lastUpdated?: string | Date; // When price was last fetched/refreshed (ISO string or Date object)
  specs: Record<string, number | string | string[]>;
  highlights: string[];
  featured?: boolean;
};

export type MockGuide = {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  tags: string[];
  content: string[];
};

export type MockBenchmark = {
  id: string;
  kind: BenchmarkKind;
  title: string;
  workload: string;
  score?: number;
  avgFps?: number;
  unit?: string;
  scoreType?: string;
  source?: string;
  resolution?: string;
  settings?: string;
  confidence?: string;
  notes: string;
  partSlug?: string;
  buildId?: string;
};

export type MockBuild = {
  id: string;
  title: string;
  description: string;
  authorName: string;
  visibility: BuildVisibility;
  status: BuildStatus;
  estimatedWattage: number;
  totalPriceCents: number;
  compatibilityStatus: CompatibilityStatus;
  trendScore: number;
  tags: string[];
  partSlugs: string[];
};

export type MockForumCategory = {
  slug: string;
  name: string;
  description: string;
};

export type MockForumAnswer = {
  id: string;
  authorName: string;
  body: string;
  voteScore: number;
  isAccepted: boolean;
  createdAt: string;
};

export type MockForumQuestion = {
  id: string;
  categorySlug: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
  answers: MockForumAnswer[];
};

export const categoryMeta = [
  {
    path: "cpu",
    category: PartCategory.CPU,
    label: "CPUs",
    singular: "CPU",
    description: "Core counts, clock speeds, and sockets that define the rest of the build.",
  },
  {
    path: "motherboard",
    category: PartCategory.MOTHERBOARD,
    label: "Motherboards",
    singular: "Motherboard",
    description: "Chipsets, socket support, form factors, and connectivity for the rig.",
  },
  {
    path: "gpu",
    category: PartCategory.GPU,
    label: "GPUs",
    singular: "GPU",
    description: "Graphics cards for gaming, creator workflows, and benchmark comparisons.",
  },
  {
    path: "ram",
    category: PartCategory.RAM,
    label: "RAM",
    singular: "RAM",
    description: "Capacity and speed options for gaming, streaming, and multitasking.",
  },
  {
    path: "storage",
    category: PartCategory.STORAGE,
    label: "Storage",
    singular: "Storage",
    description: "NVMe and SATA options sized for fast game loads and media-heavy projects.",
  },
  {
    path: "psu",
    category: PartCategory.PSU,
    label: "Power Supplies",
    singular: "PSU",
    description: "Efficiency and wattage options for stable headroom under load.",
  },
  {
    path: "case",
    category: PartCategory.CASE,
    label: "Cases",
    singular: "Case",
    description: "Airflow-focused and compact chassis options for different build styles.",
  },
  {
    path: "cooler",
    category: PartCategory.COOLER,
    label: "Coolers",
    singular: "Cooler",
    description: "Air and liquid cooling options matched to sockets and thermal targets.",
  },
] as const;

export const parts: MockPart[] = [
  {
    slug: "amd-ryzen-7-9800x3d",
    category: PartCategory.CPU,
    categoryPath: "cpu",
    brand: "AMD",
    name: "Ryzen 7 9800X3D",
    description: "A top-end gaming CPU with strong frame pacing and a broad AM5 platform runway.",
    priceCents: 47900,
    priceSource: "BEST_BUY_API",
    lastUpdated: new Date("2026-04-10T10:30:00Z"),
    specs: {
      socket: "AM5",
      cores: 8,
      threads: 16,
      tdp: "120W",
    },
    highlights: ["Gaming-first", "AM5", "High cache"],
    featured: true,
  },
  {
    slug: "intel-core-ultra-7-265k",
    category: PartCategory.CPU,
    categoryPath: "cpu",
    brand: "Intel",
    name: "Core Ultra 7 265K",
    description: "A balanced enthusiast CPU aimed at mixed gaming and productivity workloads.",
    priceCents: 41900,
    priceSource: "NEWEGG_API",
    lastUpdated: new Date("2026-04-10T09:15:00Z"),
    specs: {
      socket: "LGA1851",
      cores: 20,
      threads: 20,
      tdp: "125W",
    },
    highlights: ["Hybrid cores", "Creator-ready", "Unlocked"],
  },
  {
    slug: "asus-rog-strix-b850-a",
    category: PartCategory.MOTHERBOARD,
    categoryPath: "motherboard",
    brand: "ASUS",
    name: "ROG Strix B850-A Gaming WiFi",
    description: "An AM5 ATX motherboard with DDR5 support and enough I/O for a premium gaming rig.",
    priceCents: 27900,
    specs: {
      socket: "AM5",
      chipset: "B850",
      formFactor: "ATX",
      ramType: "DDR5",
    },
    highlights: ["ATX", "DDR5", "Wi-Fi"],
    featured: true,
  },
  {
    slug: "msi-mpg-z890-edge-ti",
    category: PartCategory.MOTHERBOARD,
    categoryPath: "motherboard",
    brand: "MSI",
    name: "MPG Z890 Edge Ti WiFi",
    description: "A clean-looking Intel board with premium connectivity for higher-end desktop builds.",
    priceCents: 32900,
    specs: {
      socket: "LGA1851",
      chipset: "Z890",
      formFactor: "ATX",
      ramType: "DDR5",
    },
    highlights: ["ATX", "PCIe 5.0", "DDR5"],
  },
  {
    slug: "nvidia-rtx-5070-ti-founders",
    category: PartCategory.GPU,
    categoryPath: "gpu",
    brand: "NVIDIA",
    name: "GeForce RTX 5070 Ti Founders Edition",
    description: "A high-value card for 1440p high refresh gaming and capable creator workloads.",
    priceCents: 74900,
    specs: {
      vram: "16GB",
      tdp: "285W",
      lengthMm: 304,
    },
    highlights: ["1440p high refresh", "DLSS-ready", "16GB VRAM"],
    featured: true,
  },
  {
    slug: "amd-radeon-rx-9070-xt",
    category: PartCategory.GPU,
    categoryPath: "gpu",
    brand: "AMD",
    name: "Radeon RX 9070 XT",
    description: "A raster-heavy GPU with strong price-to-performance for high settings at 1440p.",
    priceCents: 69900,
    specs: {
      vram: "16GB",
      tdp: "300W",
      lengthMm: 320,
    },
    highlights: ["Great raster value", "16GB VRAM", "1440p gaming"],
  },
  {
    slug: "gskill-trident-z5-32gb-6000",
    category: PartCategory.RAM,
    categoryPath: "ram",
    brand: "G.Skill",
    name: "Trident Z5 Neo RGB 32GB DDR5-6000",
    description: "A 2x16GB DDR5 kit tuned for modern AM5 gaming builds and responsive multitasking.",
    priceCents: 12900,
    specs: {
      type: "DDR5",
      capacity: "32GB",
      speed: "6000 MT/s",
      modules: "2x16GB",
    },
    highlights: ["32GB", "DDR5-6000", "Dual-channel"],
    featured: true,
  },
  {
    slug: "corsair-vengeance-64gb-6400",
    category: PartCategory.RAM,
    categoryPath: "ram",
    brand: "Corsair",
    name: "Vengeance 64GB DDR5-6400",
    description: "A larger-capacity memory kit aimed at heavier creator workflows and multitasking.",
    priceCents: 23900,
    specs: {
      type: "DDR5",
      capacity: "64GB",
      speed: "6400 MT/s",
      modules: "2x32GB",
    },
    highlights: ["64GB", "Creator focus", "DDR5"],
  },
  {
    slug: "samsung-990-pro-2tb",
    category: PartCategory.STORAGE,
    categoryPath: "storage",
    brand: "Samsung",
    name: "990 Pro 2TB",
    description: "A fast PCIe 4.0 NVMe SSD for OS, apps, and a large primary game library.",
    priceCents: 15900,
    specs: {
      type: "NVMe SSD",
      interface: "PCIe 4.0",
      capacity: "2TB",
    },
    highlights: ["2TB", "PCIe 4.0", "Fast boot drive"],
    featured: true,
  },
  {
    slug: "wd-black-sn850x-4tb",
    category: PartCategory.STORAGE,
    categoryPath: "storage",
    brand: "WD",
    name: "Black SN850X 4TB",
    description: "A high-capacity NVMe option for users with heavier game or media libraries.",
    priceCents: 28900,
    specs: {
      type: "NVMe SSD",
      interface: "PCIe 4.0",
      capacity: "4TB",
    },
    highlights: ["4TB", "High capacity", "Game library ready"],
  },
  {
    slug: "corsair-rm850x-shift",
    category: PartCategory.PSU,
    categoryPath: "psu",
    brand: "Corsair",
    name: "RM850x Shift",
    description: "An 850W Gold PSU with headroom for upper-midrange and enthusiast gaming builds.",
    priceCents: 16900,
    specs: {
      wattage: "850W",
      efficiency: "80+ Gold",
      modular: "Fully modular",
    },
    highlights: ["850W", "Gold", "Cable management friendly"],
    featured: true,
  },
  {
    slug: "seasonic-focus-gx-1000",
    category: PartCategory.PSU,
    categoryPath: "psu",
    brand: "Seasonic",
    name: "Focus GX-1000",
    description: "A 1000W unit for higher-end GPUs and extra upgrade headroom.",
    priceCents: 20900,
    specs: {
      wattage: "1000W",
      efficiency: "80+ Gold",
      modular: "Fully modular",
    },
    highlights: ["1000W", "Upgrade headroom", "Gold"],
  },
  {
    slug: "lian-li-lancool-216",
    category: PartCategory.CASE,
    categoryPath: "case",
    brand: "Lian Li",
    name: "Lancool 216",
    description: "An airflow-focused ATX case that fits larger GPUs without overcomplicating the build.",
    priceCents: 10900,
    specs: {
      supportedFormFactors: ["ATX", "Micro-ATX", "Mini-ITX"],
      maxGpuLengthMm: 392,
      maxCoolerHeightMm: 180,
    },
    highlights: ["Airflow", "ATX support", "Wide GPU clearance"],
    featured: true,
  },
  {
    slug: "fractal-north-charcoal",
    category: PartCategory.CASE,
    categoryPath: "case",
    brand: "Fractal",
    name: "North Charcoal",
    description: "A premium-looking case with practical airflow and broad component compatibility.",
    priceCents: 14900,
    specs: {
      supportedFormFactors: ["ATX", "Micro-ATX", "Mini-ITX"],
      maxGpuLengthMm: 355,
      maxCoolerHeightMm: 170,
    },
    highlights: ["Airflow", "Premium aesthetic", "ATX support"],
  },
  {
    slug: "deepcool-assassin-iv",
    category: PartCategory.COOLER,
    categoryPath: "cooler",
    brand: "DeepCool",
    name: "Assassin IV",
    description: "A flagship air cooler for strong thermals without moving to liquid cooling.",
    priceCents: 9990,
    specs: {
      supportedSockets: ["AM5", "LGA1851"],
      heightMm: 164,
      type: "Air cooler",
    },
    highlights: ["Dual tower", "AM5", "LGA1851"],
    featured: true,
  },
  {
    slug: "arctic-liquid-freezer-iii-360",
    category: PartCategory.COOLER,
    categoryPath: "cooler",
    brand: "Arctic",
    name: "Liquid Freezer III 360",
    description: "A 360mm AIO for users targeting low temps and quieter sustained loads.",
    priceCents: 14990,
    specs: {
      supportedSockets: ["AM5", "LGA1851"],
      radiatorSize: "360mm",
      type: "Liquid cooler",
    },
    highlights: ["360mm AIO", "AM5", "Intel support"],
  },
];

export const guides: MockGuide[] = [
  {
    slug: "first-gaming-build",
    title: "How to plan your first gaming build without overspending",
    excerpt: "A practical guide for balancing CPU, GPU, RAM, and storage so your first build stays focused and upgradeable.",
    readTime: "7 min read",
    tags: ["Beginner", "Budgeting", "Gaming"],
    content: [
      "The easiest mistake in a first-time gaming build is chasing peak specs in one category and starving the rest of the system. A better approach is to start with your target resolution and refresh rate, then choose the GPU and CPU pair that actually serves that goal.",
      "Once the GPU and CPU are in place, memory and storage should support the experience instead of inflating the budget. A 32GB DDR5 kit and a solid 2TB NVMe drive are often a stronger real-world choice than spending the same money on decorative upgrades.",
      "The final step is preserving upgrade headroom. Choose a motherboard, case, and PSU that support the next graphics-card cycle so you do not have to rebuild the whole rig when you only meant to replace one part.",
    ],
  },
  {
    slug: "am5-vs-intel-mainstream",
    title: "AM5 vs Intel mainstream platforms in 2026",
    excerpt: "Where each platform makes sense for gaming, mixed workloads, and future upgrade flexibility.",
    readTime: "6 min read",
    tags: ["CPU", "Platform", "Upgrade Path"],
    content: [
      "AM5 is the easier recommendation when long upgrade runway matters. If the plan is to keep the motherboard through more than one CPU generation, the platform has a clearer story for mainstream gaming builds.",
      "Intel still makes sense for users who value broader mixed-workload tuning and want a specific feature set right now. The decision should be made on use case, not brand loyalty.",
      "For RigSense, the more useful comparison is not the headline winner but the tradeoff matrix: socket longevity, board pricing, memory support, and how much total budget remains for the GPU.",
    ],
  },
  {
    slug: "1440p-builder-priority",
    title: "What matters most in a 1440p gaming PC",
    excerpt: "A breakdown of where to spend and where to hold back when targeting 1440p high-refresh play.",
    readTime: "5 min read",
    tags: ["1440p", "Builder", "Performance"],
    content: [
      "At 1440p, the GPU still drives most of the experience. That means budget should usually lean toward graphics first, then a CPU that avoids bottlenecking the card in higher-frame scenarios.",
      "Memory capacity and SSD speed matter, but only after the core performance pair is right. Thirty-two gigabytes of RAM and a competent 2TB drive are already enough for a strong build.",
      "Thermals and acoustics are often ignored during planning. A high-wattage GPU inside a cramped case creates a louder and less pleasant machine even when the benchmark numbers look good on paper.",
    ],
  },
  {
    slug: "quiet-airflow-case-picking",
    title: "Choosing a quiet case without killing airflow",
    excerpt: "A guide to balancing acoustics, GPU clearance, radiator support, and practical cable management.",
    readTime: "4 min read",
    tags: ["Cases", "Cooling", "Build Quality"],
    content: [
      "Quiet builds do not start with silence foam. They start with lower restriction airflow, sensible fan placement, and components that do not constantly run at the top of their thermal curves.",
      "Case selection should be checked against the real dimensions of the graphics card and cooler, not just the brand name on the box. Clearance is one of the fastest ways a paper build becomes frustrating in real life.",
      "Good cable routing and a reasonable amount of PSU headroom make a bigger difference to build quality than most cosmetic extras. That is why the case and power supply are part of the planning conversation early in RigSense.",
    ],
  },
];

export const publicBuilds: MockBuild[] = [
  {
    id: "aurora-1440p-beast",
    title: "Aurora 1440p Beast",
    description: "A balanced 1440p gaming rig built around strong raster performance and comfortable PSU headroom.",
    authorName: "Maya Singh",
    visibility: BuildVisibility.PUBLIC,
    status: BuildStatus.COMPLETED,
    estimatedWattage: 610,
    totalPriceCents: 223600,
    compatibilityStatus: CompatibilityStatus.OK,
    trendScore: 94,
    tags: ["1440p", "Gaming", "Airflow"],
    partSlugs: [
      "amd-ryzen-7-9800x3d",
      "asus-rog-strix-b850-a",
      "nvidia-rtx-5070-ti-founders",
      "gskill-trident-z5-32gb-6000",
      "samsung-990-pro-2tb",
      "corsair-rm850x-shift",
      "lian-li-lancool-216",
      "deepcool-assassin-iv",
    ],
  },
  {
    id: "creator-current",
    title: "Creator Current",
    description: "A mixed-workload desktop tuned for editing, rendering, and high-setting gaming after work.",
    authorName: "Jordan Lee",
    visibility: BuildVisibility.PUBLIC,
    status: BuildStatus.COMPLETED,
    estimatedWattage: 690,
    totalPriceCents: 266500,
    compatibilityStatus: CompatibilityStatus.OK,
    trendScore: 88,
    tags: ["Creator", "64GB RAM", "Mixed workload"],
    partSlugs: [
      "intel-core-ultra-7-265k",
      "msi-mpg-z890-edge-ti",
      "nvidia-rtx-5070-ti-founders",
      "corsair-vengeance-64gb-6400",
      "wd-black-sn850x-4tb",
      "seasonic-focus-gx-1000",
      "fractal-north-charcoal",
      "arctic-liquid-freezer-iii-360",
    ],
  },
  {
    id: "silent-red-team",
    title: "Silent Red Team",
    description: "A quieter AMD-focused gaming build with extra storage and premium case materials.",
    authorName: "Iman Patel",
    visibility: BuildVisibility.PUBLIC,
    status: BuildStatus.COMPLETED,
    estimatedWattage: 640,
    totalPriceCents: 229500,
    compatibilityStatus: CompatibilityStatus.OK,
    trendScore: 83,
    tags: ["AMD", "Quiet", "4TB"],
    partSlugs: [
      "amd-ryzen-7-9800x3d",
      "asus-rog-strix-b850-a",
      "amd-radeon-rx-9070-xt",
      "gskill-trident-z5-32gb-6000",
      "wd-black-sn850x-4tb",
      "corsair-rm850x-shift",
      "fractal-north-charcoal",
      "deepcool-assassin-iv",
    ],
  },
];

export const personalBuilds: MockBuild[] = [
  {
    id: "late-night-upgrade",
    title: "Late Night Upgrade",
    description: "A private draft focused on a strong AM5 base before locking the final GPU choice.",
    authorName: "You",
    visibility: BuildVisibility.PRIVATE,
    status: BuildStatus.DRAFT,
    estimatedWattage: 342,
    totalPriceCents: 124500,
    compatibilityStatus: CompatibilityStatus.WARNING,
    trendScore: 0,
    tags: ["Draft", "Private", "AM5"],
    partSlugs: [
      "amd-ryzen-7-9800x3d",
      "asus-rog-strix-b850-a",
      "gskill-trident-z5-32gb-6000",
      "samsung-990-pro-2tb",
      "corsair-rm850x-shift",
      "lian-li-lancool-216",
    ],
  },
  {
    id: "studio-hybrid",
    title: "Studio Hybrid",
    description: "A completed private build that keeps creator headroom while staying clean and quiet.",
    authorName: "You",
    visibility: BuildVisibility.PRIVATE,
    status: BuildStatus.COMPLETED,
    estimatedWattage: 672,
    totalPriceCents: 268400,
    compatibilityStatus: CompatibilityStatus.OK,
    trendScore: 0,
    tags: ["Completed", "Private", "Creator"],
    partSlugs: [
      "intel-core-ultra-7-265k",
      "msi-mpg-z890-edge-ti",
      "nvidia-rtx-5070-ti-founders",
      "corsair-vengeance-64gb-6400",
      "wd-black-sn850x-4tb",
      "seasonic-focus-gx-1000",
      "fractal-north-charcoal",
      "arctic-liquid-freezer-iii-360",
    ],
  },
  {
    id: "weekend-1440p-push",
    title: "Weekend 1440p Push",
    description: "A public completed build that is ready to be shared and benchmarked.",
    authorName: "You",
    visibility: BuildVisibility.PUBLIC,
    status: BuildStatus.COMPLETED,
    estimatedWattage: 618,
    totalPriceCents: 224900,
    compatibilityStatus: CompatibilityStatus.OK,
    trendScore: 62,
    tags: ["Completed", "Public", "1440p"],
    partSlugs: [
      "amd-ryzen-7-9800x3d",
      "asus-rog-strix-b850-a",
      "amd-radeon-rx-9070-xt",
      "gskill-trident-z5-32gb-6000",
      "samsung-990-pro-2tb",
      "corsair-rm850x-shift",
      "fractal-north-charcoal",
      "deepcool-assassin-iv",
    ],
  },
];

export const benchmarks: MockBenchmark[] = [
  {
    id: "bm-part-5070ti-1440p",
    kind: BenchmarkKind.PART,
    title: "RTX 5070 Ti Founders Edition",
    workload: "1440p Ultra Gaming",
    avgFps: 142,
    notes: "Average across a seeded set of modern AAA titles with upscaling off.",
    partSlug: "nvidia-rtx-5070-ti-founders",
  },
  {
    id: "bm-part-9070xt-1440p",
    kind: BenchmarkKind.PART,
    title: "Radeon RX 9070 XT",
    workload: "1440p Ultra Gaming",
    avgFps: 148,
    notes: "Strong raster value in the same title mix used for the other 1440p entries.",
    partSlug: "amd-radeon-rx-9070-xt",
  },
  {
    id: "bm-part-9800x3d-gaming",
    kind: BenchmarkKind.PART,
    title: "Ryzen 7 9800X3D",
    workload: "Gaming CPU Index",
    score: 97,
    notes: "Higher is better. Index normalized against this seed dataset.",
    partSlug: "amd-ryzen-7-9800x3d",
  },
  {
    id: "bm-part-265k-creator",
    kind: BenchmarkKind.PART,
    title: "Core Ultra 7 265K",
    workload: "Mixed Workload Index",
    score: 92,
    notes: "Balanced creator and compile-oriented workload score for comparison cards.",
    partSlug: "intel-core-ultra-7-265k",
  },
  {
    id: "bm-build-aurora-1440p",
    kind: BenchmarkKind.BUILD,
    title: "Aurora 1440p Beast",
    workload: "1440p Competitive Mix",
    avgFps: 201,
    notes: "High-refresh result across lighter competitive titles at tuned settings.",
    buildId: "aurora-1440p-beast",
  },
  {
    id: "bm-build-creator-render",
    kind: BenchmarkKind.BUILD,
    title: "Creator Current",
    workload: "Rendering Index",
    score: 91,
    notes: "Normalized creator score emphasizing sustained mixed workload performance.",
    buildId: "creator-current",
  },
  {
    id: "bm-build-silent-1440p",
    kind: BenchmarkKind.BUILD,
    title: "Silent Red Team",
    workload: "1440p Ultra Gaming",
    avgFps: 146,
    notes: "Solid raster-heavy 1440p result with quieter thermals than typical open builds.",
    buildId: "silent-red-team",
  },
];

export const forumCategories: MockForumCategory[] = [
  {
    slug: "troubleshooting",
    name: "Troubleshooting",
    description: "Boot issues, thermals, crashes, BIOS quirks, and upgrade pain points.",
  },
  {
    slug: "build-help",
    name: "Build Help",
    description: "Questions about part selection, compatibility, and saving money without losing performance.",
  },
  {
    slug: "gpu-advice",
    name: "GPU Advice",
    description: "VRAM, resolution targets, creator workloads, and best-fit graphics card choices.",
  },
  {
    slug: "budget-builds",
    name: "Budget Builds",
    description: "Stretching value across gaming, school, and creator builds with realistic tradeoffs.",
  },
];

export const forumQuestions: MockForumQuestion[] = [
  {
    id: "is-750w-enough-for-5070ti",
    categorySlug: "build-help",
    title: "Is a quality 750W PSU enough for a 5070 Ti build?",
    body: "I am pairing a 5070 Ti with an AM5 gaming CPU and I already own a good 750W Gold unit. I want to know whether it is still smart to keep it or if I should move to 850W for better headroom.",
    authorName: "Alex Moreno",
    createdAt: "2026-04-05",
    viewCount: 412,
    answers: [
      {
        id: "a-750w-1",
        authorName: "Rina Cho",
        body: "A strong 750W unit can run that build, but it leaves you less margin for transient spikes and future GPU upgrades. For a brand-new purchase, 850W is the easier long-term choice.",
        voteScore: 23,
        isAccepted: true,
        createdAt: "2026-04-05",
      },
      {
        id: "a-750w-2",
        authorName: "Samir Das",
        body: "If you already own a modern Tier-A 750W PSU, I would only replace it if you care about keeping fan noise down under GPU spikes or if you expect a hotter next-gen card later.",
        voteScore: 14,
        isAccepted: false,
        createdAt: "2026-04-05",
      },
    ],
  },
  {
    id: "am5-or-intel-for-editing-and-gaming",
    categorySlug: "build-help",
    title: "AM5 or Intel for someone who edits video and games equally?",
    body: "I spend roughly half my time gaming and half editing short-form video. I do not upgrade often, so I care about platform longevity too.",
    authorName: "Nadia Ross",
    createdAt: "2026-04-04",
    viewCount: 365,
    answers: [
      {
        id: "a-platform-1",
        authorName: "Julian Park",
        body: "If upgrade runway matters, AM5 is the cleaner pick. If your editing stack benefits more from Intel-specific behavior right now, then Intel can still make sense, but it is less about future CPU swaps.",
        voteScore: 18,
        isAccepted: false,
        createdAt: "2026-04-04",
      },
      {
        id: "a-platform-2",
        authorName: "Lena Ford",
        body: "For a balanced mixed-use machine, I would decide based on total platform cost rather than CPU alone. Motherboard pricing, memory kit tuning, and cooler needs can shift the real answer more than the headline chip does.",
        voteScore: 11,
        isAccepted: true,
        createdAt: "2026-04-04",
      },
    ],
  },
  {
    id: "gpu-sag-or-just-heavy-card",
    categorySlug: "troubleshooting",
    title: "How do I tell if my GPU has dangerous sag or is just heavy?",
    body: "My new card tilts slightly when installed. Temperatures are fine, but I am not sure if I should add support now or leave it alone.",
    authorName: "Eli Brooks",
    createdAt: "2026-04-03",
    viewCount: 291,
    answers: [
      {
        id: "a-sag-1",
        authorName: "Morgan Hill",
        body: "If the PCB looks level enough that the connector and slot are not visibly under strain, you are probably fine, but a support bracket is still cheap insurance on a heavy card.",
        voteScore: 9,
        isAccepted: true,
        createdAt: "2026-04-03",
      },
    ],
  },
  {
    id: "best-1440p-card-under-800",
    categorySlug: "gpu-advice",
    title: "Best 1440p card under $800 if I do not care much about ray tracing?",
    body: "I mostly want strong high-settings raster performance and enough VRAM for newer games over the next few years.",
    authorName: "Priya Nair",
    createdAt: "2026-04-02",
    viewCount: 508,
    answers: [
      {
        id: "a-gpu-1",
        authorName: "Cam West",
        body: "For that exact brief, the seeded Radeon option in this build plan category makes the most sense. You keep excellent raster value and 16GB VRAM without paying for features you do not prioritize.",
        voteScore: 27,
        isAccepted: true,
        createdAt: "2026-04-02",
      },
      {
        id: "a-gpu-2",
        authorName: "Irene Vega",
        body: "I would still compare total platform cost and resale value. Sometimes the more expensive card is easier to justify if the whole build balance shifts around it.",
        voteScore: 8,
        isAccepted: false,
        createdAt: "2026-04-02",
      },
    ],
  },
];

export const partMap = new Map(parts.map((part) => [part.slug, part]));

export function getCategory(path: string) {
  return categoryMeta.find((category) => category.path === path);
}

export function getCategoryPathForCategory(category: PartCategory) {
  return categoryMeta.find((item) => item.category === category)?.path;
}

export function getPartsByCategory(path: string) {
  return parts.filter((part) => part.categoryPath === path);
}

export function getPartBySlug(slug: string) {
  return partMap.get(slug);
}

export function getPartByCategoryAndSlug(categoryPath: string, slug: string) {
  return parts.find(
    (part) => part.categoryPath === categoryPath && part.slug === slug,
  );
}

export function getGuideBySlug(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}

export function getBuildById(id: string) {
  return publicBuilds.find((build) => build.id === id);
}

export function getAnyBuildById(id: string) {
  return [...personalBuilds, ...publicBuilds].find((build) => build.id === id);
}

export function getBuildParts(build: MockBuild) {
  return build.partSlugs.map((slug) => partMap.get(slug)).filter(Boolean) as MockPart[];
}

export function getBenchmarksForPart(slug: string) {
  return benchmarks.filter((benchmark) => benchmark.partSlug === slug);
}

export function getBenchmarksForBuild(id: string) {
  return benchmarks.filter((benchmark) => benchmark.buildId === id);
}

export function getForumCategoryBySlug(slug: string) {
  return forumCategories.find((category) => category.slug === slug);
}

export function getQuestionsByCategory(slug: string) {
  return forumQuestions.filter((question) => question.categorySlug === slug);
}

export function getForumQuestionById(id: string) {
  return forumQuestions.find((question) => question.id === id);
}

export function getFeaturedParts() {
  return parts.filter((part) => part.featured);
}

export function getTrendingBuilds() {
  return [...publicBuilds].sort((left, right) => right.trendScore - left.trendScore);
}

export function getPersonalBuilds() {
  return [...personalBuilds];
}

export function getRecentQuestions() {
  return [...forumQuestions].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function getHomeStats() {
  return [
    { label: "Seeded parts", value: String(parts.length) },
    { label: "Guides", value: String(guides.length) },
    { label: "Public builds", value: String(publicBuilds.length) },
    { label: "Forum questions", value: String(forumQuestions.length) },
  ];
}
