import Moralis from "moralis"

// Initialize Moralis
export const initMoralis = async () => {
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY || process.env.NEXT_PUBLIC_MORALIS_API_KEY,
      })
      console.log("Moralis initialized successfully")
    }
  } catch (error) {
    console.error("Failed to initialize Moralis:", error)
  }
}

// Get user stats from Moralis
export const getUserStats = async (address: string) => {
  try {
    await initMoralis()

    // Query the database for user stats
    // In a real implementation, we would use Moralis.Cloud.run or a similar method
    // For now, we'll use localStorage as a fallback since we're in a client environment

    if (typeof window !== "undefined") {
      const statsKey = `fugitive-tracker-stats-${address}`
      const savedStats = localStorage.getItem(statsKey)

      if (savedStats) {
        try {
          const parsedStats = JSON.parse(savedStats)
          return {
            captures: parsedStats.captures || 0,
            escapes: parsedStats.escapes || 0,
          }
        } catch (e) {
          console.error("Error parsing saved stats:", e)
        }
      }
    }

    // If no stats found or error parsing, return default stats
    return { captures: 0, escapes: 0 }
  } catch (error) {
    console.error("Error fetching user stats from Moralis:", error)
    return { captures: 0, escapes: 0 }
  }
}

// Save user stats to Moralis
export const saveUserStats = async (address: string, stats: { captures: number; escapes: number }) => {
  try {
    await initMoralis()

    // In a real implementation, we would use Moralis.Cloud.run or a similar method
    // For now, we'll use localStorage as a fallback since we're in a client environment

    if (typeof window !== "undefined") {
      const statsKey = `fugitive-tracker-stats-${address}`
      localStorage.setItem(statsKey, JSON.stringify(stats))
    }

    // Simulate a Moralis API call
    console.log(`Stats saved for ${address}: Captures=${stats.captures}, Escapes=${stats.escapes}`)

    return { success: true }
  } catch (error) {
    console.error("Error saving user stats to Moralis:", error)
    return { success: false }
  }
}

// Get leaderboard data from Moralis
export const getLeaderboard = async (timeframe: "daily" | "weekly" | "all-time") => {
  try {
    await initMoralis()

    // In a real implementation, we would query Moralis for leaderboard data
    // For now, we'll return mock data

    // Mock leaderboard data
    const mockLeaderboard = [
      { rank: 1, address: "7xKX...9mPq", captures: 156, escapes: 89, winRate: 63.7, totalGames: 245, rewards: 45.2 },
      { rank: 2, address: "9kLm...3nRt", captures: 142, escapes: 78, winRate: 64.5, totalGames: 220, rewards: 38.7 },
      { rank: 3, address: "5pQr...8vWx", captures: 134, escapes: 91, winRate: 59.6, totalGames: 225, rewards: 35.1 },
      { rank: 4, address: "2hBn...7cYz", captures: 128, escapes: 67, winRate: 65.6, totalGames: 195, rewards: 32.4 },
      { rank: 5, address: "8tFg...4jKl", captures: 119, escapes: 83, winRate: 58.9, totalGames: 202, rewards: 29.8 },
      { rank: 6, address: "6mVc...1pLq", captures: 115, escapes: 76, winRate: 60.2, totalGames: 191, rewards: 27.3 },
      { rank: 7, address: "4nXz...5rSt", captures: 108, escapes: 89, winRate: 54.8, totalGames: 197, rewards: 24.9 },
      { rank: 8, address: "3dWe...9hMn", captures: 102, escapes: 71, winRate: 59.0, totalGames: 173, rewards: 22.1 },
      { rank: 9, address: "1kPo...6tYu", captures: 98, escapes: 84, winRate: 53.8, totalGames: 182, rewards: 19.7 },
      { rank: 10, address: "9iUy...2qAz", captures: 94, escapes: 78, winRate: 54.7, totalGames: 172, rewards: 17.8 },
    ]

    // For daily and weekly, we'll return a subset of the data with different values
    if (timeframe === "daily") {
      return mockLeaderboard.slice(0, 5).map((entry, i) => ({
        ...entry,
        rank: i + 1,
        captures: Math.floor(entry.captures / 10),
        escapes: Math.floor(entry.escapes / 10),
        totalGames: Math.floor(entry.totalGames / 10),
        rewards: Number((entry.rewards / 10).toFixed(1)),
      }))
    } else if (timeframe === "weekly") {
      return mockLeaderboard.slice(0, 8).map((entry, i) => ({
        ...entry,
        rank: i + 1,
        captures: Math.floor(entry.captures / 2),
        escapes: Math.floor(entry.escapes / 2),
        totalGames: Math.floor(entry.totalGames / 2),
        rewards: Number((entry.rewards / 2).toFixed(1)),
      }))
    }

    return mockLeaderboard
  } catch (error) {
    console.error("Error fetching leaderboard data from Moralis:", error)
    return []
  }
}
