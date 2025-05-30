"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Clock, DollarSign, Target, Zap, Trophy } from "lucide-react"
import { config } from "@/lib/config"

interface Fugitive {
  id: string
  name: string
  description: string
  sprite: string
  deadline: Date
  totalPool: number
  yesPool: number
  noPool: number
  yesOdds: number
  noOdds: number
  status: "active" | "caught" | "escaped"
  daysRemaining: number
}

interface BettingSystemProps {
  walletAddress: string | null
  isConnected: boolean
}

export function BettingSystem({ walletAddress, isConnected }: BettingSystemProps) {
  useEffect(() => {
    console.log("BettingSystem: Wallet address:", walletAddress)
    console.log("BettingSystem: Is connected:", isConnected)
  }, [walletAddress, isConnected])

  const [selectedFugitive, setSelectedFugitive] = useState<string | null>(null)
  const [betAmount, setBetAmount] = useState("")
  const [betType, setBetType] = useState<"yes" | "no">("yes")
  const [userBets, setUserBets] = useState<any[]>([])
  const [isPlacingBet, setIsPlacingBet] = useState(false)

  // Mock fugitive data - in real app this would come from Moralis
  const [fugitives, setFugitives] = useState<Fugitive[]>([
    {
      id: "antoine-masse",
      name: "Antoine Masse",
      description: "High-profile fugitive from New Orleans East",
      sprite: "🥷",
      deadline: new Date(0), // placeholder
      totalPool: 2847.5,
      yesPool: 1623.2,
      noPool: 1224.3,
      yesOdds: 2.4,
      noOdds: 3.1,
      status: "active",
      daysRemaining: 15, // placeholder
    },
    {
      id: "derrick-groves",
      name: "Derrick Groves",
      description: "Escaped from custody in French Quarter",
      sprite: "🏃",
      deadline: new Date(0), // placeholder
      totalPool: 1456.8,
      yesPool: 892.1,
      noPool: 564.7,
      yesOdds: 1.8,
      noOdds: 4.2,
      status: "active",
      daysRemaining: 8, // placeholder
    },
  ])

  // Set real deadlines and daysRemaining on client only
  useEffect(() => {
    const now = Date.now();
    setFugitives((prev) => [
      {
        ...prev[0],
        deadline: new Date(now + 15 * 24 * 60 * 60 * 1000),
        daysRemaining: 15,
      },
      {
        ...prev[1],
        deadline: new Date(now + 8 * 24 * 60 * 60 * 1000),
        daysRemaining: 8,
      },
    ]);
  }, []);

  // Calculate dynamic odds based on time remaining
  const calculateDynamicOdds = (fugitive: Fugitive) => {
    const totalDays = 30 // Assume 30 day markets
    const daysPassed = totalDays - fugitive.daysRemaining
    const timeMultiplier = 1 + (daysPassed / totalDays) * 2 // Odds increase up to 3x

    const poolRatio = fugitive.yesPool / fugitive.noPool
    const baseYesOdds = 1.5 + 1 / poolRatio
    const baseNoOdds = 1.5 + poolRatio

    return {
      yesOdds: Number((baseYesOdds * timeMultiplier).toFixed(2)),
      noOdds: Number((baseNoOdds * timeMultiplier).toFixed(2)),
    }
  }

  // Update odds every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setFugitives((prev) =>
        prev.map((fugitive) => {
          const newOdds = calculateDynamicOdds(fugitive)
          return {
            ...fugitive,
            yesOdds: newOdds.yesOdds,
            noOdds: newOdds.noOdds,
          }
        }),
      )
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Load user bets from localStorage (in real app, from Moralis)
  useEffect(() => {
    if (walletAddress) {
      const savedBets = localStorage.getItem(`bets-${walletAddress}`)
      if (savedBets) {
        setUserBets(JSON.parse(savedBets))
      }
    }
  }, [walletAddress])

  const placeBet = async () => {
    if (!walletAddress || !selectedFugitive || !betAmount) return

    setIsPlacingBet(true)

    try {
      // --- BEGIN WALLET INTERACTION ---
      if (!config.rpcEndpoint) {
        alert("No RPC endpoint configured. Please check your environment variables.")
        setIsPlacingBet(false)
        return
      }
      if (typeof window !== "undefined" && window.solana && window.solana.isPhantom) {
        // Use wallet address from environment variable
        const recipient = config.betPoolWallet
        if (!recipient) {
          alert("No bet pool wallet address configured. Please check your environment variables.")
          setIsPlacingBet(false)
          return
        }
        const amountLamports = Math.floor(Number.parseFloat(betAmount) * 1e9) // 1 SOL = 1e9 lamports
        // @ts-ignore
        const solanaWeb3 = (await import("@solana/web3.js"))
        const connection = new solanaWeb3.Connection(config.rpcEndpoint)
        const fromPubkey = new solanaWeb3.PublicKey(walletAddress)
        const toPubkey = new solanaWeb3.PublicKey(recipient)
        const transaction = new solanaWeb3.Transaction().add(
          solanaWeb3.SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: amountLamports,
          })
        )
        transaction.feePayer = fromPubkey
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        // @ts-ignore
        const signed = await window.solana.signTransaction(transaction)
        const txid = await connection.sendRawTransaction(signed.serialize())
        await connection.confirmTransaction(txid)
      } else {
        alert("Phantom wallet not found or not connected.")
        setIsPlacingBet(false)
        return
      }
      // --- END WALLET INTERACTION ---

      // Simulate bet placement (in real app, this would interact with Solana smart contract)
      // await new Promise((resolve) => setTimeout(resolve, 2000))

      const fugitive = fugitives.find((f) => f.id === selectedFugitive)!
      const amount = Number.parseFloat(betAmount)

      const newBet = {
        id: Date.now().toString(),
        fugitiveId: selectedFugitive,
        fugitiveName: fugitive.name,
        amount,
        type: betType,
        odds: betType === "yes" ? fugitive.yesOdds : fugitive.noOdds,
        potentialWin: amount * (betType === "yes" ? fugitive.yesOdds : fugitive.noOdds),
        timestamp: new Date(),
        status: "active",
      }

      const updatedBets = [...userBets, newBet]
      setUserBets(updatedBets)
      localStorage.setItem(`bets-${walletAddress}`, JSON.stringify(updatedBets))

      // Update fugitive pools
      setFugitives((prev) =>
        prev.map((f) => {
          if (f.id === selectedFugitive) {
            const newYesPool = betType === "yes" ? f.yesPool + amount : f.yesPool
            const newNoPool = betType === "no" ? f.noPool + amount : f.noPool
            return {
              ...f,
              yesPool: newYesPool,
              noPool: newNoPool,
              totalPool: newYesPool + newNoPool,
            }
          }
          return f
        }),
      )

      setBetAmount("")
      alert(`Bet placed successfully! ${amount} SOL on ${betType.toUpperCase()} for ${fugitive.name}`)
    } catch (error) {
      console.error("Error placing bet:", error)
      alert("Failed to place bet. Please try again.")
    } finally {
      setIsPlacingBet(false)
    }
  }

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining <= 3) return "text-red-400"
    if (daysRemaining <= 7) return "text-orange-400"
    if (daysRemaining <= 14) return "text-yellow-400"
    return "text-green-400"
  }

  const getUrgencyBadge = (daysRemaining: number) => {
    if (daysRemaining <= 3) return "bg-red-500/20 text-red-300 border-red-500/30"
    if (daysRemaining <= 7) return "bg-orange-500/20 text-orange-300 border-orange-500/30"
    if (daysRemaining <= 14) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    return "bg-green-500/20 text-green-300 border-green-500/30"
  }

  // Check for RPC endpoint
  if (!config.rpcEndpoint) {
    console.error("No RPC endpoint configured. Please check your environment variables.");
    return null;
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        {/* Jupiter Terminal's built-in modal will be used instead */}
      </div>

      <Card className="bg-black/30 border-purple-800/30 backdrop-blur-sm mt-6 relative">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
          Fugitive Betting Market
        </div>
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Target className="mr-2 h-5 w-5 text-purple-400" />
            Fugitive Prediction Market
          </CardTitle>
          <CardDescription className="text-gray-300">
            Bet on whether fugitives will be caught before their deadline. Odds increase as time runs out!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="markets" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/30 border border-purple-800/30">
              <TabsTrigger value="markets" className="data-[state=active]:bg-purple-600">
                Active Markets
              </TabsTrigger>
              <TabsTrigger value="mybets" className="data-[state=active]:bg-purple-600">
                My Bets ({userBets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="markets" className="space-y-4">
              {/* Market Overview */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-black/20 border-purple-800/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {fugitives.reduce((sum, f) => sum + f.totalPool, 0).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-400">Total Pool (SOL)</div>
                  </CardContent>
                </Card>
                <Card className="bg-black/20 border-purple-800/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{fugitives.length}</div>
                    <div className="text-sm text-gray-400">Active Markets</div>
                  </CardContent>
                </Card>
                <Card className="bg-black/20 border-purple-800/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.max(...fugitives.map((f) => f.yesOdds), ...fugitives.map((f) => f.noOdds)).toFixed(1)}x
                    </div>
                    <div className="text-sm text-gray-400">Highest Odds</div>
                  </CardContent>
                </Card>
              </div>

              {/* Fugitive Markets */}
              <div className="space-y-4">
                {fugitives.map((fugitive) => (
                  <Card
                    key={fugitive.id}
                    className={`bg-black/20 border-purple-800/20 transition-all hover:bg-black/30 ${
                      selectedFugitive === fugitive.id ? "ring-2 ring-purple-500" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">{fugitive.sprite}</div>
                          <div>
                            <h3 className="text-white font-bold">{fugitive.name}</h3>
                            <p className="text-gray-400 text-sm">{fugitive.description}</p>
                          </div>
                        </div>
                        <Badge className={getUrgencyBadge(fugitive.daysRemaining)}>
                          <Clock className="h-3 w-3 mr-1" />
                          {fugitive.daysRemaining}d left
                        </Badge>
                      </div>

                      {/* Pool Distribution */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>Will be caught: {fugitive.yesPool.toFixed(1)} SOL</span>
                          <span>Won't be caught: {fugitive.noPool.toFixed(1)} SOL</span>
                        </div>
                        <Progress value={(fugitive.yesPool / fugitive.totalPool) * 100} className="h-2" />
                      </div>

                      {/* Betting Options */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => {
                            setSelectedFugitive(fugitive.id)
                            setBetType("yes")
                          }}
                          variant={selectedFugitive === fugitive.id && betType === "yes" ? "default" : "outline"}
                          className="flex flex-col p-4 h-auto border-green-500/30 text-green-300 hover:bg-green-500/10"
                        >
                          <div className="flex items-center mb-1">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span className="font-bold">YES</span>
                          </div>
                          <div className="text-lg font-bold">{fugitive.yesOdds}x</div>
                          <div className="text-xs opacity-75">Will be caught</div>
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedFugitive(fugitive.id)
                            setBetType("no")
                          }}
                          variant={selectedFugitive === fugitive.id && betType === "no" ? "default" : "outline"}
                          className="flex flex-col p-4 h-auto border-red-500/30 text-red-300 hover:bg-red-500/10"
                        >
                          <div className="flex items-center mb-1">
                            <TrendingDown className="h-4 w-4 mr-1" />
                            <span className="font-bold">NO</span>
                          </div>
                          <div className="text-lg font-bold">{fugitive.noOdds}x</div>
                          <div className="text-xs opacity-75">Won't be caught</div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Betting Interface */}
              {selectedFugitive && (
                <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">
                      Place Bet: {fugitives.find((f) => f.id === selectedFugitive)?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="text-gray-300 text-sm block mb-1">Bet Amount (SOL)</label>
                        <Input
                          type="number"
                          placeholder="0.1"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          className="bg-black/20 border-purple-800/30 text-white"
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-gray-300 text-sm">Potential Win</div>
                        <div className="text-white font-bold">
                          {betAmount
                            ? (
                                Number.parseFloat(betAmount) *
                                (betType === "yes"
                                  ? fugitives.find((f) => f.id === selectedFugitive)?.yesOdds || 0
                                  : fugitives.find((f) => f.id === selectedFugitive)?.noOdds || 0)
                              ).toFixed(2)
                            : "0.00"}{" "}
                          SOL
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={placeBet}
                      disabled={!betAmount || isPlacingBet}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      {isPlacingBet ? "Placing Bet..." : `Bet ${betAmount || "0"} SOL on ${betType.toUpperCase()}`}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="mybets" className="space-y-4">
              {userBets.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                  <p className="text-gray-400">No bets placed yet</p>
                  <p className="text-gray-500 text-sm">Switch to Active Markets to place your first bet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userBets.map((bet) => (
                    <Card key={bet.id} className="bg-black/20 border-purple-800/20">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-white font-semibold">{bet.fugitiveName}</h4>
                            <p className="text-gray-400 text-sm">
                              {bet.amount} SOL on {bet.type.toUpperCase()} @ {bet.odds}x odds
                            </p>
                            <p className="text-gray-500 text-xs">{new Date(bet.timestamp).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-bold">+{bet.potentialWin.toFixed(2)} SOL</div>
                            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">{bet.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
