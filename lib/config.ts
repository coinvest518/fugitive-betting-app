// Constants for API configuration
const API_RETRY_COUNT = 3;
const API_RETRY_DELAY = 1000; // 1 second

const getRpcEndpoint = () => {
  const primary = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  const fallback = process.env.NEXT_PUBLIC_SOLANA_RPC_FALLBACK;
  
  if (!primary && !fallback) {
    throw new Error('No RPC endpoint configured. Please set NEXT_PUBLIC_SOLANA_RPC_URL or NEXT_PUBLIC_SOLANA_RPC_FALLBACK in your .env file');
  }
  
  return primary || fallback;
};

// Utility function to retry failed API calls
export async function retryFetch(url: string, options?: RequestInit): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < API_RETRY_COUNT; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < API_RETRY_COUNT - 1) {
        await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY * (i + 1)));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch after retries');
}

export const config = {
  rpcEndpoint: getRpcEndpoint(),
  betPoolWallet: process.env.NEXT_PUBLIC_BET_POOL_WALLET || "",
  feeRecipient: process.env.NEXT_PUBLIC_BET_POOL_WALLET || "",
  // SOL token mint address
  solTokenMint: "So11111111111111111111111111111111111111112",
  feeBps: 50, // 0.5% fee
  jupiter: {
    // Fee accounts for Jupiter Terminal
    platformFeeAccounts: {
      // USDC fee account (sourced from .env, do not hardcode addresses)
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": process.env.NEXT_PUBLIC_BET_POOL_WALLET || "" // USDC fee account
    },
    pricingApiUrl: "https://price.jup.ag/v4/",
    quoteApiUrl: "https://quote-api.jup.ag/v6/quote",
    swapApiUrl: "https://quote-api.jup.ag/v6/swap",
    retryCount: API_RETRY_COUNT,
    retryDelay: API_RETRY_DELAY,
  },
}
