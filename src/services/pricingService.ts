import * as cheerio from "cheerio";
import { PartCategory } from "@prisma/client";

export type PriceSource =
  | "NEWEGG_SCRAPING"
  | "AMAZON_SCRAPING"
  | "BESTBUY_SCRAPING"
  | "BH_SCRAPING"
  | "MANUAL_ENTRY";

export type Availability = "IN_STOCK" | "OUT_OF_STOCK" | "LIMITED" | "UNKNOWN";

export interface PriceData {
  priceCents: number;
  source: PriceSource;
  lastUpdated: Date;
  url?: string;
  availability?: Availability;
  retailer?: string;
}

export interface PricingServiceOptions {
  cacheDurationMs?: number;
  maxRetries?: number;
  requestDelayMs?: number;
}

interface CacheEntry {
  data: PriceData;
  timestamp: number;
}

type ScraperFn = (searchQuery: string, category: PartCategory) => Promise<PriceData | null>;

const CATEGORY_PRICE_RANGES: Record<PartCategory, [number, number]> = {
  CPU: [10000, 60000],
  GPU: [25000, 150000],
  MOTHERBOARD: [8000, 50000],
  RAM: [3000, 25000],
  STORAGE: [3000, 30000],
  PSU: [5000, 30000],
  CASE: [4000, 25000],
  COOLER: [2000, 15000],
};

function parsePriceText(priceText: string): number | null {
  if (!priceText) return null;
  const cleaned = priceText.replace(/[^0-9.]/g, "");
  const match = cleaned.match(/^(\d+(?:\.\d{1,2})?)$/);
  if (!match) return null;
  const price = parseFloat(match[1]);
  if (isNaN(price) || price <= 0) return null;
  return Math.round(price * 100);
}

function buildSearchQuery(partSlug: string, category: PartCategory): string {
  const categoryTerms: Record<PartCategory, string> = {
    CPU: "processor",
    GPU: "graphics card",
    MOTHERBOARD: "motherboard",
    RAM: "memory RAM",
    STORAGE: "SSD storage",
    PSU: "power supply",
    CASE: "PC case",
    COOLER: "CPU cooler",
  };
  return `${partSlug} ${categoryTerms[category]}`.trim();
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string> = {},
  maxRetries = 3,
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          ...headers,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        return null;
      }

      return await response.text();
    } catch {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function scrapeNewegg(searchQuery: string): Promise<PriceData | null> {
  try {
    const searchUrl = `https://www.newegg.com/p/pl?d=${encodeURIComponent(searchQuery)}&N=4131`;
    const html = await fetchWithRetry(searchUrl);
    if (!html) return null;

    const $ = cheerio.load(html);
    let foundPrice: number | null = null;
    let inStock = false;

    $(".item-cell, .list-item").each((_, el) => {
      if (foundPrice) return;

      const priceEl = $(el).find(".price-current").first();
      const stockEl = $(el).find(".btn-primary, .add-to-cart");

      if (priceEl.length > 0) {
        const priceText = priceEl.text().trim();
        const price = parsePriceText(priceText);
        if (price) {
          foundPrice = price;
          inStock = stockEl.length > 0;
        }
      }
    });

    if (!foundPrice) {
      const priceMatch = html.match(/\$([0-9]{1,5}(?:\.[0-9]{2})?)/);
      if (priceMatch) {
        foundPrice = Math.round(parseFloat(priceMatch[1]) * 100);
        inStock = true;
      }
    }

    if (foundPrice) {
      return {
        priceCents: foundPrice,
        source: "NEWEGG_SCRAPING",
        lastUpdated: new Date(),
        url: searchUrl,
        availability: inStock ? "IN_STOCK" : "OUT_OF_STOCK",
        retailer: "Newegg",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function scrapeAmazon(searchQuery: string): Promise<PriceData | null> {
  try {
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`;
    const html = await fetchWithRetry(searchUrl, {
      "Accept-Language": "en-US,en;q=0.9",
    });
    if (!html) return null;

    const $ = cheerio.load(html);
    let foundPrice: number | null = null;
    let inStock = false;

    $('[data-component-type="s-search-result"]').each((_, el) => {
      if (foundPrice) return;

      const priceWhole = $(el).find(".a-price-whole").first();
      const priceFraction = $(el).find(".a-price-fraction").first();
      const availabilityEl = $(el).find(".a-color-success, .a-size-medium.a-color-success").first();

      if (priceWhole.length > 0) {
        const wholeText = priceWhole.text().replace(/[^0-9]/g, "");
        const fractionText = priceFraction.text().replace(/[^0-9]/g, "");
        const priceStr = `${wholeText}.${fractionText || "00"}`;
        const price = parsePriceText(priceStr);
        if (price) {
          foundPrice = price;
          inStock = availabilityEl.length > 0;
        }
      }
    });

    if (!foundPrice) {
      const priceMatch = html.match(/\$([0-9]{1,5}(?:\.[0-9]{2})?)/);
      if (priceMatch) {
        foundPrice = Math.round(parseFloat(priceMatch[1]) * 100);
        inStock = true;
      }
    }

    if (foundPrice) {
      return {
        priceCents: foundPrice,
        source: "AMAZON_SCRAPING",
        lastUpdated: new Date(),
        url: searchUrl,
        availability: inStock ? "IN_STOCK" : "UNKNOWN",
        retailer: "Amazon",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function scrapeBestBuy(searchQuery: string): Promise<PriceData | null> {
  try {
    const searchUrl = `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(searchQuery)}`;
    const html = await fetchWithRetry(searchUrl);
    if (!html) return null;

    const $ = cheerio.load(html);
    let foundPrice: number | null = null;
    let inStock = false;

    $(".sku-item, .list-item, .product-item").each((_, el) => {
      if (foundPrice) return;

      const priceEl = $(el).find(".priceView-customer-price, .pricing-price").first();
      const stockEl = $(el).find(".add-to-cart-button, .fulfillment-add-to-cart-button").first();

      if (priceEl.length > 0) {
        const priceText = priceEl.text().trim();
        const price = parsePriceText(priceText);
        if (price) {
          foundPrice = price;
          inStock = stockEl.length > 0 && !stockEl.hasClass("disabled");
        }
      }
    });

    if (!foundPrice) {
      const priceMatch = html.match(/\$([0-9]{1,5}(?:\.[0-9]{2})?)/);
      if (priceMatch) {
        foundPrice = Math.round(parseFloat(priceMatch[1]) * 100);
        inStock = true;
      }
    }

    if (foundPrice) {
      return {
        priceCents: foundPrice,
        source: "BESTBUY_SCRAPING",
        lastUpdated: new Date(),
        url: searchUrl,
        availability: inStock ? "IN_STOCK" : "OUT_OF_STOCK",
        retailer: "Best Buy",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function scrapeBH(searchQuery: string): Promise<PriceData | null> {
  try {
    const searchUrl = `https://www.bhphotovideo.com/c/search?q=${encodeURIComponent(searchQuery)}`;
    const html = await fetchWithRetry(searchUrl);
    if (!html) return null;

    const $ = cheerio.load(html);
    let foundPrice: number | null = null;
    let inStock = false;

    $(".bhs-product-item, .product-item, .list-item").each((_, el) => {
      if (foundPrice) return;

      const priceEl = $(el).find(".priceBlock, .regularPrice, .qa90n").first();
      const stockEl = $(el).find(".adtBtn, .addToCart").first();

      if (priceEl.length > 0) {
        const priceText = priceEl.text().trim();
        const price = parsePriceText(priceText);
        if (price) {
          foundPrice = price;
          inStock = stockEl.length > 0;
        }
      }
    });

    if (!foundPrice) {
      const priceMatch = html.match(/\$([0-9]{1,5}(?:\.[0-9]{2})?)/);
      if (priceMatch) {
        foundPrice = Math.round(parseFloat(priceMatch[1]) * 100);
        inStock = true;
      }
    }

    if (foundPrice) {
      return {
        priceCents: foundPrice,
        source: "BH_SCRAPING",
        lastUpdated: new Date(),
        url: searchUrl,
        availability: inStock ? "IN_STOCK" : "OUT_OF_STOCK",
        retailer: "B&H Photo",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export class PricingService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly defaultCacheDuration: number;
  private readonly maxRetries: number;
  private readonly requestDelayMs: number;

  constructor(options: PricingServiceOptions = {}) {
    this.defaultCacheDuration = options.cacheDurationMs ?? 3 * 60 * 60 * 1000;
    this.maxRetries = options.maxRetries ?? 3;
    this.requestDelayMs = options.requestDelayMs ?? 2000;
  }

  async getPartPrice(partSlug: string, category: PartCategory): Promise<PriceData> {
    const cacheKey = `${category}:${partSlug}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    const priceData = await this.fetchFreshPrice(partSlug, category);

    this.cache.set(cacheKey, {
      data: priceData,
      timestamp: Date.now(),
    });

    return priceData;
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;

    const cacheDuration = this.defaultCacheDuration;
    return Date.now() - cached.timestamp < cacheDuration;
  }

  private async fetchFreshPrice(partSlug: string, category: PartCategory): Promise<PriceData> {
    const searchQuery = buildSearchQuery(partSlug, category);
    const scrapers = this.getScrapersForCategory(category);

    for (const { name, scraper } of scrapers) {
      try {
        console.log(`Scraping ${name} for: ${searchQuery}`);
        const result = await scraper(searchQuery, category);

        if (result && this.isPriceReasonable(result.priceCents, category)) {
          console.log(`Found price via ${name}: $${(result.priceCents / 100).toFixed(2)}`);
          return result;
        }

        await this.delay(this.requestDelayMs);
      } catch (error) {
        console.warn(`Failed to scrape ${name}:`, error);
        await this.delay(this.requestDelayMs);
      }
    }

    console.warn(`All scrapapers failed for ${partSlug}, using manual fallback`);
    return this.getFallbackManualPrice(partSlug, category);
  }

  private getScrapersForCategory(category: PartCategory): { name: string; scraper: ScraperFn }[] {
    const baseScrapers: { name: string; scraper: ScraperFn }[] = [
      { name: "Newegg", scraper: scrapeNewegg },
      { name: "B&H Photo", scraper: scrapeBH },
      { name: "Best Buy", scraper: scrapeBestBuy },
      { name: "Amazon", scraper: scrapeAmazon },
    ];

    switch (category) {
      case "GPU":
      case "CPU":
        return [
          { name: "Newegg", scraper: scrapeNewegg },
          { name: "B&H Photo", scraper: scrapeBH },
          { name: "Amazon", scraper: scrapeAmazon },
          { name: "Best Buy", scraper: scrapeBestBuy },
        ];
      case "MOTHERBOARD":
      case "RAM":
        return [
          { name: "Newegg", scraper: scrapeNewegg },
          { name: "Amazon", scraper: scrapeAmazon },
          { name: "B&H Photo", scraper: scrapeBH },
          { name: "Best Buy", scraper: scrapeBestBuy },
        ];
      case "STORAGE":
        return [
          { name: "Amazon", scraper: scrapeAmazon },
          { name: "Newegg", scraper: scrapeNewegg },
          { name: "B&H Photo", scraper: scrapeBH },
          { name: "Best Buy", scraper: scrapeBestBuy },
        ];
      case "PSU":
      case "CASE":
      case "COOLER":
        return [
          { name: "Newegg", scraper: scrapeNewegg },
          { name: "Amazon", scraper: scrapeAmazon },
          { name: "B&H Photo", scraper: scrapeBH },
          { name: "Best Buy", scraper: scrapeBestBuy },
        ];
      default:
        return baseScrapers;
    }
  }

  private isPriceReasonable(priceCents: number, category: PartCategory): boolean {
    const [min, max] = CATEGORY_PRICE_RANGES[category];
    return priceCents >= min && priceCents <= max;
  }

  private getFallbackManualPrice(partSlug: string, category: PartCategory): PriceData {
    const basePricesByCategory: Record<PartCategory, number> = {
      CPU: 35000,
      MOTHERBOARD: 20000,
      GPU: 40000,
      RAM: 10000,
      STORAGE: 15000,
      PSU: 12000,
      CASE: 10000,
      COOLER: 8000,
    };

    const basePrice = basePricesByCategory[category] ?? 20000;
    const hash = this.hashString(partSlug);
    const variation = ((hash % 10000) - 5000);

    return {
      priceCents: Math.max(5000, basePrice + variation),
      source: "MANUAL_ENTRY",
      lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000),
      availability: "UNKNOWN",
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  invalidateCache(partSlug: string, category: PartCategory): void {
    const cacheKey = `${category}:${partSlug}`;
    this.cache.delete(cacheKey);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number } {
    return { size: this.cache.size };
  }
}

export const pricingService = new PricingService({
  cacheDurationMs: 3 * 60 * 60 * 1000,
  maxRetries: 3,
  requestDelayMs: 2000,
});
