import { db } from '@/lib/db';
import { PricingProvider } from './provider';
import { MockPricingProvider } from './mock-provider';
import { logger } from '@/lib/logger';

export class PricingService {
  private providers: PricingProvider[] = [
    new MockPricingProvider(),
  ];

  async refreshPartPricing(partId: string): Promise<void> {
    const part = await db.part.findUnique({ where: { id: partId } });
    if (!part) throw new Error(`Part not found: ${partId}`);

    const allOffers = [];
    
    for (const provider of this.providers) {
      if (await provider.isHealthy()) {
        try {
          const offers = await provider.fetchOffers(part.id, part.slug);
          allOffers.push(...offers);
        } catch (error) {
          logger.error(`Failed to fetch offers from ${provider.name} for part ${partId}`, { error });
        }
      } else {
         logger.warn(`Provider ${provider.name} is unhealthy`);
      }
    }

    if (allOffers.length > 0) {
      await db.$transaction(async (tx) => {
        // Delete old offers
        await tx.offer.deleteMany({
          where: { partId: part.id }
        });

        // Insert new offers
        await tx.offer.createMany({
          data: allOffers.map(offer => ({
            partId: part.id,
            ...offer
          }))
        });
        
        // Resolution Strategy for conflicting/unavailable price data:
        // 1. Filter out offers that are OUT_OF_STOCK or UNKNOWN.
        // 2. From the remaining IN_STOCK or LIMITED offers, find the lowest price.
        // 3. If multiple providers have the same lowest price, the first one encountered wins (or prioritize by trusted source if needed).
        // 4. If no offers are available (all out of stock), do not update the base price, but update the lastUpdated timestamp to mark the check as complete.
        
        const inStockOffers = allOffers.filter(o => 
          o.availability === 'IN_STOCK' || o.availability === 'LIMITED'
        );
        
        if (inStockOffers.length > 0) {
          const bestOffer = inStockOffers.reduce((min, curr) => 
            curr.priceCents < min.priceCents ? curr : min
          );

          await tx.part.update({
            where: { id: part.id },
            data: {
              priceCents: bestOffer.priceCents,
              priceSource: bestOffer.source,
              lastUpdated: new Date()
            }
          });
          
          // Optionally save to price history
          await tx.priceHistory.create({
            data: {
              partId: part.id,
              priceCents: bestOffer.priceCents,
              source: bestOffer.source
            }
          });
        } else {
            // mark out of stock?
            await tx.part.update({
                where: { id: part.id },
                data: { lastUpdated: new Date() }
            });
        }
      });
      logger.info(`Refreshed pricing for part ${partId}`);
    } else {
      logger.info(`No offers found for part ${partId}`);
    }
  }
}

export const pricingService = new PricingService();
