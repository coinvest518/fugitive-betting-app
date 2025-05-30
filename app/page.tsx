"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, Wallet, ArrowRightLeft, Trophy, Users, Zap, Shield, Coins } from "lucide-react"
import Link from "next/link"
import { WalletConnection } from "@/components/wallet-connection"

export default function LandingPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  const features = [
    {
      icon: <Gamepad2 className="h-8 w-8" />,
      title: "Immersive Gameplay",
      description: "Experience the thrill of hide-and-seek in a beautifully crafted New Orleans setting",
    },
    {
      icon: <Wallet className="h-8 w-8" />,
      title: "Web3 Integration",
      description: "Connect your Solana wallet and earn rewards for successful captures and escapes",
    },
    {
      icon: <ArrowRightLeft className="h-8 w-8" />,
      title: "Jupiter Swap",
      description: "Seamlessly swap tokens to purchase in-game items and power-ups",
    },
    {
      icon: <Trophy className="h-8 w-8" />,
      title: "Competitive Leaderboards",
      description: "Climb the ranks and prove you're the ultimate fugitive tracker",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Multiplayer Modes",
      description: "Challenge friends or play against AI in various game modes",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Power-ups & Items",
      description: "Use special abilities and items to gain advantages in your hunts",
    },
  ]

  const stats = [
    { label: "Active Players", value: "12,847", icon: <Users className="h-5 w-5" /> },
    { label: "Games Played", value: "156,392", icon: <Gamepad2 className="h-5 w-5" /> },
    { label: "Total Rewards", value: "2,847 SOL", icon: <Coins className="h-5 w-5" /> },
    { label: "Success Rate", value: "67%", icon: <Trophy className="h-5 w-5" /> },
  ]

  // Jupiter modal integration
  useEffect(() => {
    if (typeof window !== "undefined" && !window.Jupiter) {
      const script = document.createElement("script");
      script.src = "https://terminal.jup.ag/main-v4.js";
      script.async = true;
      script.onload = () => {
        // Optionally, Jupiter is now available
      };
      document.body.appendChild(script);
    }
  }, []);

  const openJupiterModal = () => {
    if (window.Jupiter) {
      window.Jupiter.init({
        endpoint: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "",
        displayMode: "modal",
        containerId: "", // Required by JupiterTerminalConfig, safe to use empty string for modal
        platformFeeAndAccounts: {
          feeBps: 50,
          feeAccounts: {
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": process.env.NEXT_PUBLIC_BET_POOL_WALLET || "", // USDC
            "So11111111111111111111111111111111111111112": process.env.NEXT_PUBLIC_BET_POOL_WALLET || "", // SOL (wrapped)
            [process.env.NEXT_PUBLIC_FBT_TOKEN_MINT || ""]: process.env.NEXT_PUBLIC_FBT_FEE_WALLET || "", // FBT
          },
        },
        integratedTargetId: undefined,
        onSuccess: () => {},
        onError: () => {},
      });
    }
  };

  // Inject CoinGecko widget script on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("coingecko-marquee-script")) {
      const script = document.createElement("script");
      script.src = "https://widgets.coingecko.com/gecko-coin-price-marquee-widget.js";
      script.async = true;
      script.id = "coingecko-marquee-script";
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-purple-800/30 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Gamepad2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Fugitive Tracker</span>
          </div>
          <WalletConnection
            onConnect={(address) => {
              setIsConnected(true)
              setWalletAddress(address)
            }}
            onDisconnect={() => {
              setIsConnected(false)
              setWalletAddress(null)
            }}
          />
        </div>
      </header>

      {/* CoinGecko Marquee Widget */}
      <div className="w-full bg-black/40 border-b border-purple-800/30 flex justify-center items-center py-2 z-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <gecko-coin-price-marquee-widget locale="en" outlined="true" coin-ids="bitcoin,ethereum,solana,dogecoin,pepe,bonk,fugitive-bet-token" initial-currency="usd"></gecko-coin-price-marquee-widget>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-purple-600/20 text-purple-300 border-purple-500/30">
            🎮 Web3 Gaming Experience
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Fugitive Bets 
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Enter the neon-lit streets of New Orleans in this thrilling hide-and-seek game. Use strategy, cunning, and
            blockchain rewards to become the ultimate tracker or escape artist.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isConnected ? (
              <Link href="/game">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
                >
                  <Gamepad2 className="mr-2 h-5 w-5" />
                  Start Playing
                </Button>
              </Link>
            ) : (
              <Button size="lg" disabled className="bg-gray-600 text-gray-300 px-8 py-3">
                <Shield className="mr-2 h-5 w-5" />
                Connect Wallet to Play
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="border-purple-500 text-purple-300 hover:bg-purple-500/10 px-8 py-3"
              onClick={openJupiterModal}
            >
              <ArrowRightLeft className="mr-2 h-5 w-5" />
              Swap Tokens
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-500 text-purple-300 hover:bg-purple-500/10 px-8 py-3"
            >
              Watch Trailer
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-black/30 border-purple-800/30 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2 text-purple-400">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Game Features</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Experience cutting-edge gameplay mechanics combined with Web3 technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-black/30 border-purple-800/30 backdrop-blur-sm hover:bg-black/40 transition-colors"
              >
                <CardHeader>
                  <div className="text-purple-400 mb-2">{feature.icon}</div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="py-20 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How to Play</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Master the art of tracking and evasion in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Choose Your Role</h3>
              <p className="text-gray-300">Decide whether you want to be a cunning fugitive or a skilled tracker</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Navigate New Orleans</h3>
              <p className="text-gray-300">Explore iconic districts and use the environment to your advantage</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Earn Rewards</h3>
              <p className="text-gray-300">
                Win games to earn tokens, climb leaderboards, and unlock exclusive content
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30 backdrop-blur-sm max-w-4xl mx-auto">
            <CardContent className="p-12">
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Your Hunt?</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Join thousands of players in the most exciting Web3 hide-and-seek experience
              </p>

              {isConnected ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/game">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
                    >
                      <Gamepad2 className="mr-2 h-5 w-5" />
                      Play Now
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-purple-500 text-purple-300 hover:bg-purple-500/10 px-8 py-3"
                    >
                      <Trophy className="mr-2 h-5 w-5" />
                      View Leaderboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-purple-300 text-lg">Connect your wallet above to start playing</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-800/30 bg-black/20 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2024 Fugitive Tracker. Built on Solana blockchain.</p>
        </div>
      </footer>
    </div>
  )
}
