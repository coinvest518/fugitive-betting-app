"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { config, retryFetch } from '@/lib/config';

interface TokenPrices {
  [tokenMint: string]: {
    price: number;
    timestamp: number;
  };
}

interface TokenPriceContextType {
  prices: TokenPrices;
  loading: boolean;
  error: string | null;
  refreshPrices: () => Promise<void>;
}

const TokenPriceContext = createContext<TokenPriceContextType>({
  prices: {},
  loading: true,
  error: null,
  refreshPrices: async () => {},
});

export const useTokenPrices = () => useContext(TokenPriceContext);

interface TokenPriceProviderProps {
  children: React.ReactNode;
  tokens?: string[];
}

export function TokenPriceProvider({ children, tokens = [config.solTokenMint] }: TokenPriceProviderProps) {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      tokens.forEach(token => params.append('ids', token));
      // Add custom RPC endpoint if present
      if (config.rpcEndpoint) {
        params.append('rpc', config.rpcEndpoint);
      }
      // Use new Jupiter price API endpoint with custom RPC
      const response = await retryFetch(`${config.jupiter.pricingApiUrl}?${params.toString()}`);
      const data = await response.json();

      const updatedPrices: TokenPrices = {};
      tokens.forEach(token => {
        if (data.data[token]) {
          updatedPrices[token] = {
            price: data.data[token].price,
            timestamp: data.data[token].timestamp,
          };
        }
      });

      setPrices(updatedPrices);
    } catch (err) {
      setError('Failed to fetch token prices. Please try again later.');
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    // Refresh prices every minute
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [tokens.join(',')]);

  const value = {
    prices,
    loading,
    error,
    refreshPrices: fetchPrices,
  };

  return (
    <TokenPriceContext.Provider value={value}>
      {children}
    </TokenPriceContext.Provider>
  );
}
