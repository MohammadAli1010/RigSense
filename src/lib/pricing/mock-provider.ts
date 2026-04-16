import { OfferAvailability } from '@prisma/client';
import { PricingProvider, ProviderOffer } from './provider';

export class MockPricingProvider implements PricingProvider {
  name = 'MOCK_PROVIDER';

  async fetchOffers(partId: string, partSlug: string): Promise<ProviderOffer[]> {
    // Generate some stable fake data based on partId
    const basePrice = (partId.length * 10) + 5000; 
    
    return [
      {
        retailer: 'Mock Amazon',
        url: `https://amazon.mock/product/${partSlug}`,
        priceCents: basePrice + 199,
        availability: OfferAvailability.IN_STOCK,
        source: this.name,
      },
      {
        retailer: 'Mock Newegg',
        url: `https://newegg.mock/product/${partSlug}`,
        priceCents: basePrice,
        availability: OfferAvailability.LIMITED,
        source: this.name,
      },
    ];
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}
