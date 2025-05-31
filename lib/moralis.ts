// Type definitions
export interface BetData {
  id?: string;
  user_address: string;
  fugitiveId: string;
  fugitiveName: string;
  amount: number;
  type: "yes" | "no";
  odds: number;
  potentialWin: number;
  status: "active" | "won" | "lost";
  timestamp: Date;
}

interface UserStats {
  address: string;
  captures: number;
  escapes: number;
  totalGames: number;
  winRate: number;
  rewards: number;
}

// API endpoints for data storage
const API_BASE_URL = '/api';

// Save bet data using Supabase API
export const saveBet = async (bet: Omit<BetData, 'id' | 'status' | 'timestamp'>) => {
  const response = await fetch('/api/bets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...bet,
      status: 'active',
      timestamp: new Date(),
    }),
  });
  return response.json();
};

// Get user's bets from Supabase API
export const getUserBets = async (address: string): Promise<BetData[]> => {
  const response = await fetch(`/api/users/${address}/bets`);
  const data = await response.json();
  return data.bets || [];
};

// Update bet status
export const updateBetStatus = async (betId: string, status: "won" | "lost"): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bets/${betId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    return { success: response.ok };
  } catch (error) {
    console.error("Error updating bet status:", error);
    return { success: false };
  }
};

// Get pool statistics for a fugitive from Supabase API
export const getFugitivePoolStats = async (fugitiveId: string): Promise<{
  totalPool: number;
  yesPool: number;
  noPool: number;
}> => {
  const response = await fetch(`/api/fugitives/${fugitiveId}/pool-stats`);
  return response.json();
};

// Get user stats
export const getUserStats = async (address: string): Promise<{ 
  captures: number; 
  escapes: number; 
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}/fbt-game-stats`);
    const data = await response.json();
    return data || { captures: 0, escapes: 0 };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { captures: 0, escapes: 0 };
  }
};

// Save user stats
export const saveUserStats = async (
  address: string, 
  stats: { captures: number; escapes: number }
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${address}/fbt-game-stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats)
    });

    return { success: response.ok };
  } catch (error) {
    console.error("Error saving user stats:", error);
    return { success: false };
  }
};

// Get leaderboard data
export const getLeaderboard = async (timeframe: "daily" | "weekly" | "all-time"): Promise<UserStats[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/leaderboard?timeframe=${timeframe}`);
    const data = await response.json();
    return data.leaderboard || [];
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
};
