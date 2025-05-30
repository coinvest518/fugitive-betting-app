"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"
import Moralis from "moralis"
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface WalletConnectionProps {
  onConnect: (address: string) => void
  onDisconnect: () => void
}

export function WalletConnection({ onConnect, onDisconnect }: WalletConnectionProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize Moralis on component mount
  useEffect(() => {
    const initMoralis = async () => {
      try {
        if (!Moralis.Core.isStarted) {
          await Moralis.start({
            apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
          })
        }
      } catch (error) {
        console.error("Failed to initialize Moralis:", error)
      }
    }

    initMoralis()
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    try {
      // Only try Phantom wallet
      if (typeof window !== "undefined" && window.solana) {
        try {
          const response = await window.solana.connect({ onlyIfTrusted: true })
          if (response.publicKey) {
            const address = response.publicKey.toString()
            setWalletAddress(address)
            setIsConnected(true)
            onConnect(address)
            return
          }
        } catch (error) {
          console.log("Phantom wallet not connected")
        }
      }
    } catch (error) {
      console.log("Wallet not connected")
    }
  }

  useEffect(() => {
    // Dispatch a custom event when wallet state changes
    if (isConnected && walletAddress) {
      const event = new CustomEvent("walletConnected", {
        detail: { address: walletAddress },
      })
      window.dispatchEvent(event)
      console.log("Dispatched walletConnected event with address:", walletAddress)
    }
  }, [isConnected, walletAddress])

  const connectWallet = async () => {
    setIsLoading(true)
    try {
      if (typeof window !== "undefined" && window.solana) {
        try {
          const response = await window.solana.connect()
          const address = response.publicKey.toString()
          setWalletAddress(address)
          setIsConnected(true)
          onConnect(address)
          setIsLoading(false)
          return
        } catch (error) {
          console.log("Failed to connect Phantom wallet")
        }
      }
      alert("Please install Phantom Wallet to connect")
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      if (typeof window !== "undefined" && window.solana) {
        try {
          await window.solana.disconnect()
        } catch (error) {
          console.log("Failed to disconnect Phantom wallet")
        }
      }
      setWalletAddress(null)
      setIsConnected(false)
      onDisconnect()
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (isConnected && walletAddress) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-green-600/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30">
          <span className="mr-1">💰</span> {formatAddress(walletAddress)}
        </div>
        <Button
          onClick={disconnectWallet}
          variant="outline"
          size="sm"
          className="border-red-500/30 text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <WalletMultiButton />
    </div>
  )
}

// Extend Window interface for Solana wallet
declare global {
  interface Window {
    // Remove solana type declaration to avoid conflicts with wallet adapter
  }
}
