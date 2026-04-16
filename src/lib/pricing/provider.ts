import { OfferAvailability } from '@prisma/client';

export interface ProviderOffer {
  retailer: string;
  url: string;
  priceCents: number;
  availability: OfferAvailability;
  source: string;
}

export interface PricingProvider {
  name: string;
  fetchOffers(partId: string, partSlug: string): Promise<ProviderOffer[]>;
  isHealthy(): Promise<boolean>;
}
