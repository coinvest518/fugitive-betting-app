"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trophy, Medal, Award, Crown, Loader2 } from "lucide-react"
import Link from "next/link"
import { getLeaderboard } from "@/lib/moralis"

interface LeaderboardEntry {
  rank: number
  address: string
  captures: number
  escapes: number
  winRate: number
  totalGames: number
  rewards: number
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "all-time">("all-time")
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true)
      try {
        const data = await getLeaderboard(timeframe)
        setLeaderboardData(data)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        // Fallback to mock data if Moralis fails
        setLeaderboardData([
          {
            rank: 1,
            address: "7xKX...9mPq",
            captures: 156,
            escapes: 89,
            winRate: 63.7,
            totalGames: 245,
            rewards: 45.2,
          },
          {
            rank: 2,
            address: "9kLm...3nRt",
            captures: 142,
            escapes: 78,
            winRate: 64.5,
            totalGames: 220,
            rewards: 38.7,
          },
          {
            rank: 3,
            address: "5pQr...8vWx",
            captures: 134,
            escapes: 91,
            winRate: 59.6,
            totalGames: 225,
            rewards: 35.1,
          },
          {
            rank: 4,
            address: "2hBn...7cYz",
            captures: 128,
            escapes: 67,
            winRate: 65.6,
            totalGames: 195,
            rewards: 32.4,
          },
          {
            rank: 5,
            address: "8tFg...4jKl",
            captures: 119,
            escapes: 83,
            winRate: 58.9,
            totalGames: 202,
            rewards: 29.8,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [timeframe])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <Trophy className="h-5 w-5 text-purple-400" />
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500 to-yellow-600"
      case 2:
        return "bg-gradient-to-r from-gray-400 to-gray-500"
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-700"
      default:
        return "bg-gradient-to-r from-purple-600 to-purple-700"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">🏆 Leaderboard</h1>
          <div className="text-purple-300 text-sm">Top Trackers & Fugitives</div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-black/30 border-purple-800/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">12,847</div>
              <div className="text-sm text-gray-400">Active Players</div>
            </CardContent>
          </Card>
          <Card className="bg-black/30 border-purple-800/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">156,392</div>
              <div className="text-sm text-gray-400">Games Played</div>
            </CardContent>
          </Card>
          <Card className="bg-black/30 border-purple-800/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">2,847</div>
              <div className="text-sm text-gray-400">SOL Distributed</div>
            </CardContent>
          </Card>
          <Card className="bg-black/30 border-purple-800/30 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">67%</div>
              <div className="text-sm text-gray-400">Avg Win Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-black/30 border border-purple-800/30">
            <TabsTrigger value="daily" className="data-[state=active]:bg-purple-600">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="data-[state=active]:bg-purple-600">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="all-time" className="data-[state=active]:bg-purple-600">
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Leaderboard */}
        <Card className="bg-black/30 border-purple-800/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-400" />
              Top Players - {timeframe.charAt(0).toUpperCase() + timeframe.slice(1).replace("-", " ")}
            </CardTitle>
            <CardDescription className="text-gray-300">
              Rankings based on win rate and total games played
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                <span className="ml-2 text-gray-300">Loading leaderboard data...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboardData.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-white/5 ${
                      entry.rank <= 3
                        ? "bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30"
                        : "bg-black/20 border-purple-800/20"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(entry.rank)}
                        <Badge className={`${getRankBadgeColor(entry.rank)} text-white border-0`}>#{entry.rank}</Badge>
                      </div>
                      <div>
                        <div className="font-mono text-white font-semibold">{entry.address}</div>
                        <div className="text-sm text-gray-400">{entry.totalGames} games played</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="text-green-400 font-semibold">{entry.captures}</div>
                        <div className="text-gray-400">Captures</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-semibold">{entry.escapes}</div>
                        <div className="text-gray-400">Escapes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-cyan-400 font-semibold">{entry.winRate}%</div>
                        <div className="text-gray-400">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-semibold">{entry.rewards}</div>
                        <div className="text-gray-400">SOL Earned</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Stats */}
        <Card className="mt-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Your Performance</CardTitle>
            <CardDescription className="text-gray-300">
              Connect your wallet to see your ranking and stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">Connect your wallet to view your leaderboard position</div>
              <Link href="/">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Connect Wallet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
