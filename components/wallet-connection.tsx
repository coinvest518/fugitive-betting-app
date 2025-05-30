"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface WalletConnectionProps {
  onConnect: (address: string) => void
  onDisconnect: () => void
}

export function WalletConnection({ onConnect, onDisconnect }: WalletConnectionProps) {
  const { publicKey, connected, disconnect } = useWallet();

  // Callbacks for parent
  useEffect(() => {
    if (connected && publicKey) {
      onConnect(publicKey.toBase58());
    } else {
      onDisconnect();
    }
  }, [connected, publicKey, onConnect, onDisconnect]);

  if (connected && publicKey) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-green-600/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30">
          <span className="mr-1">💰</span> {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </div>
        <Button
          onClick={disconnect}
          variant="outline"
          size="sm"
          className="border-red-500/30 text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <WalletMultiButton />
    </div>
  );
}

// Extend Window interface for Solana wallet
declare global {
  interface Window {
    // Remove solana type declaration to avoid conflicts with wallet adapter
  }
}
