// functions/src/renderJobs/providers/index.ts
// Provider factory - returns correct adapter based on type

import { ExternalApiProvider } from './ExternalApiProvider';
import type { ProviderAdapter } from './ProviderAdapter';
import { TestProvider } from './TestProvider';

export type { ProviderAdapter, ProviderStatusResponse } from './ProviderAdapter';

/**
 * GET PROVIDER ADAPTER
 * ====================
 * Factory function to get correct provider adapter
 * 
 * @param provider - Provider type ('test' | 'external_api' | 'aws_gpu')
 * @returns Provider adapter instance
 */
export function getProviderAdapter(provider: string): ProviderAdapter {
    switch (provider) {
        case 'test':
            return new TestProvider();

        case 'external_api':
            return new ExternalApiProvider();

        case 'aws_gpu':
            // TODO: Implement AwsGpuProvider
            throw new Error('aws_gpu provider not yet implemented - use "test" or "external_api"');

        default:
            console.warn(`[ProviderFactory] Unknown provider: ${provider}, falling back to test`);
            return new TestProvider();
    }
}
