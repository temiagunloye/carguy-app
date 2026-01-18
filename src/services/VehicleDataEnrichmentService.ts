// src/services/VehicleDataEnrichmentService.ts

import axios from 'axios';

/**
 * Service for enriching vehicle data via scraping/lookup
 * Implements rate limiting and caching
 */

export interface EnrichedVehicleSpecs {
    trim: string;
    engine: string;
    drivetrain: string;
    mpg: string;
    exteriorColor: string;
    interiorColor: string;
    features: string[];
    confidence: number; // 0-1
    provenance: string; // Source URL
    timestamp: Date;
}

// In-memory cache
interface CacheEntry {
    data: EnrichedVehicleSpecs;
    timestamp: number;
}

const enrichmentCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting
const rateLimitQueue: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 10;

class VehicleDataEnrichmentService {
    /**
     * Check rate limit
     */
    private async checkRateLimit(): Promise<void> {
        const now = Date.now();

        // Remove requests older than 1 minute
        while (rateLimitQueue.length > 0 && now - rateLimitQueue[0] > 60000) {
            rateLimitQueue.shift();
        }

        if (rateLimitQueue.length >= MAX_REQUESTS_PER_MINUTE) {
            // Wait until oldest request expires
            const oldestRequest = rateLimitQueue[0];
            const waitTime = 60000 - (now - oldestRequest);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }

        rateLimitQueue.push(now);
    }

    /**
     * Enrich vehicle data from a dealer listing URL
     */
    async enrichFromListingUrl(url: string): Promise<EnrichedVehicleSpecs | null> {
        // Check cache
        const cacheKey = `url:${url}`;
        const cached = enrichmentCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        try {
            await this.checkRateLimit();

            // Fetch the listing page
            const response = await axios.get(url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (compatible; CarGuyApp/1.0; +https://thatappcompany.co)',
                },
                timeout: 10000,
            });

            const html = response.data;

            // Parse HTML for vehicle specs
            // NOTE:This is a simplified parser. In production, use a proper HTML parser
            // and site-specific selectors for common dealer platforms
            const specs = this.parseVehicleSpecs(html, url);

            if (specs) {
                // Cache the result
                enrichmentCache.set(cacheKey, { data: specs, timestamp: Date.now() });
                return specs;
            }

            return null;
        } catch (error) {
            console.error('Failed to enrich from listing URL:', error);
            return null;
        }
    }

    /**
     * Parse vehicle specs from HTML
     * This is a simplified implementation - in production, use site-specific parsers
     */
    private parseVehicleSpecs(html: string, sourceUrl: string): EnrichedVehicleSpecs | null {
        const specs: Partial<EnrichedVehicleSpecs> = {
            features: [],
            provenance: sourceUrl,
            timestamp: new Date(),
        };

        try {
            // Extract trim (common patterns)
            const trimMatch = html.match(/trim[:\s]+([^\n<]+)/i);
            if (trimMatch) specs.trim = trimMatch[1].trim();

            // Extract engine
            const engineMatch = html.match(/engine[:\s]+([^\n<]+)/i);
            if (engineMatch) specs.engine = engineMatch[1].trim();

            // Extract drivetrain
            const drivetrainMatch = html.match(/drivetrain[:\s]+([^\n<]+)/i);
            if (drivetrainMatch) specs.drivetrain = drivetrainMatch[1].trim();

            // Extract MPG
            const mpgMatch = html.match(/mpg[:\s]+([^\n<]+)/i);
            if (mpgMatch) specs.mpg = mpgMatch[1].trim();

            // Extract exterior color
            const exteriorMatch = html.match(/exterior[:\s]+([^\n<]+)/i);
            if (exteriorMatch) specs.exteriorColor = exteriorMatch[1].trim();

            // Extract interior color
            const interiorMatch = html.match(/interior[:\s]+([^\n<]+)/i);
            if (interiorMatch) specs.interiorColor = interiorMatch[1].trim();

            // Calculate confidence based on how many fields we found
            const foundFields = Object.keys(specs).filter(
                (key) => key !== 'features' && key !== 'provenance' && key !== 'timestamp' && specs[key as keyof typeof specs]
            ).length;

            specs.confidence = Math.min(foundFields / 6, 1.0);

            // Only return if we found at least some data
            if (specs.confidence > 0) {
                return specs as EnrichedVehicleSpecs;
            }

            return null;
        } catch (error) {
            console.error('Failed to parse vehicle specs:', error);
            return null;
        }
    }

    /**
     * Enrich from VIN (if API available)
     * Placeholder for future VIN lookup services
     */
    async enrichFromVin(vin: string): Promise<EnrichedVehicleSpecs | null> {
        // Check cache
        const cacheKey = `vin:${vin}`;
        const cached = enrichmentCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        // TODO: Implement VIN lookup via API (e.g., NHTSA, CarMD, etc.)
        // For now, return null
        console.log(`VIN lookup not yet implemented for ${vin}`);
        return null;
    }

    /**
     * Enrich from make/model/year/trim identifiers
     * Could use automotive APIs or databases
     */
    async enrichFromIdentifiers(
        make: string,
        model: string,
        year: number,
        trim?: string
    ): Promise<EnrichedVehicleSpecs | null> {
        const cacheKey = `id:${make}-${model}-${year}-${trim || 'base'}`;
        const cached = enrichmentCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        // TODO: Implement lookup via automotive database
        // For now, return null
        console.log(`Identifier lookup not yet implemented for ${make} ${model} ${year}`);
        return null;
    }

    /**
     * Clear enrichment cache
     */
    clearCache(): void {
        enrichmentCache.clear();
    }

    /**
     * Get cache stats
     */
    getCacheStats(): { size: number; entries: string[] } {
        return {
            size: enrichmentCache.size,
            entries: Array.from(enrichmentCache.keys()),
        };
    }
}

// Export singleton instance
export const vehicleDataEnrichmentService = new VehicleDataEnrichmentService();
export default vehicleDataEnrichmentService;
