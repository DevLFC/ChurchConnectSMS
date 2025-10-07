import { storage } from "./storage";
import { log } from "./vite";

interface BalanceFetchResult {
  providerId: string;
  providerName: string;
  success: boolean;
  balance?: string;
  error?: string;
}

class BalanceFetchService {
  async fetchAllProviderBalances(): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: BalanceFetchResult[];
  }> {
    const providers = await storage.getSMSProviders();
    const results: BalanceFetchResult[] = [];

    for (const provider of providers) {
      const result = await this.fetchProviderBalance(provider.id);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: results.length,
      successful,
      failed,
      results
    };
  }

  async fetchProviderBalance(providerId: string): Promise<BalanceFetchResult> {
    try {
      const provider = await storage.getSMSProvider(providerId);
      
      if (!provider) {
        return {
          providerId,
          providerName: 'Unknown',
          success: false,
          error: 'Provider not found'
        };
      }

      if (provider.name.toLowerCase().includes('nigeriabulksms')) {
        return await this.fetchNigeriaBulkSMSBalance(provider);
      }

      return {
        providerId: provider.id,
        providerName: provider.name,
        success: false,
        error: 'Balance check not supported for this provider'
      };

    } catch (error) {
      log(`Error fetching balance for provider ${providerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        providerId,
        providerName: 'Unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async fetchNigeriaBulkSMSBalance(provider: any): Promise<BalanceFetchResult> {
    try {
      const params = new URLSearchParams();
      
      if (provider.authMethod === 'api_key') {
        params.append('apikey', provider.apiKey || '');
      } else if (provider.authMethod === 'username_password') {
        params.append('username', provider.username || '');
        params.append('password', provider.password || '');
      }
      
      params.append('action', 'balance');

      const fullUrl = `https://portal.nigeriabulksms.com/api/?${params.toString()}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Balance API returned status ${response.status}`);
      }

      const balanceText = await response.text();
      
      await storage.updateProviderBalance(provider.id, balanceText);

      log(`Balance fetched for ${provider.name}: ${balanceText}`);

      return {
        providerId: provider.id,
        providerName: provider.name,
        success: true,
        balance: balanceText
      };

    } catch (error) {
      log(`Failed to fetch NigeriaBulkSMS balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        providerId: provider.id,
        providerName: provider.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const balanceFetchService = new BalanceFetchService();
