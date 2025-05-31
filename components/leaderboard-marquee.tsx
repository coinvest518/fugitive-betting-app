"use client"

import { useEffect, useState } from "react"
import { getLeaderboard } from "@/lib/moralis"
import { Trophy, Crown, Medal, Award } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  address: string
  captures: number
  escapes: number
  winRate: number
  totalGames: number
  rewards: number
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="inline h-4 w-4 text-yellow-400 mr-1" />
    case 2:
      return <Medal className="inline h-4 w-4 text-gray-400 mr-1" />
    case 3:
      return <Award className="inline h-4 w-4 text-amber-600 mr-1" />
    default:
      return <Trophy className="inline h-4 w-4 text-purple-400 mr-1" />
  }
}

const MOCK_ENTRIES: LeaderboardEntry[] = [
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
]

export function LeaderboardMarquee() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    getLeaderboard("all-time")
      .then((data) => {
        if (data && data.length) {
          setEntries(data.slice(0, 10).map((entry, i) => ({ ...entry, rank: i + 1 })))
        } else {
          setEntries(MOCK_ENTRIES)
        }
      })
      .catch(() => {
        setEntries(MOCK_ENTRIES)
      })
  }, [])

  const displayEntries = entries.length ? entries : MOCK_ENTRIES
  // Duplicate entries for seamless looping
  const marqueeEntries = [...displayEntries, ...displayEntries]

  return (
    <div
      className="w-screen left-1/2 -translate-x-1/2 relative overflow-hidden py-2 bg-black/40 border-b border-purple-800/30 z-30"
      style={{ position: "relative" }}
      aria-label="Leaderboard Marquee"
    >
      <div className="relative w-full">
        <div
          className="flex gap-4 sm:gap-8 animate-marquee whitespace-nowrap w-max"
          style={{ animationDuration: "30s" }}
        >
          {marqueeEntries.map((entry, idx) => (
            <span
              key={`${entry.address}-${entry.rank}-${idx}`}
              className="flex items-center gap-2 px-2 sm:px-4 py-1 rounded-full bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700/30 text-white text-xs sm:text-sm font-semibold shadow-md"
            >
              {getRankIcon(entry.rank)}
              <span className="font-mono">{entry.address}</span>
              <span className="text-green-400">{entry.captures} Captures</span>
              <span className="text-purple-400">{entry.escapes} Escapes</span>
              <span className="text-yellow-400">{entry.rewards} SOL</span>
            </span>
          ))}
        </div>
      </div>
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}