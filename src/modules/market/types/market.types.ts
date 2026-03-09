export interface MarketIndex {
    value: number;
    direction: 'up' | 'down' | 'flat';
    percentChange: number;
    description?: string;
    baseValue?: number;
}

export interface CommodityPrice {
    id: string;
    name?: string;
    nameVi?: string;
    price: number;
    percentChange: number | null;
    emoji: string;
}

export interface MarketData {
    index: MarketIndex;
    prices: CommodityPrice[];
}

export interface PredictResult {
    success: boolean;
    direction?: 'up' | 'down';
    message: string;
    alreadyPredicted?: boolean;
}

export interface RatioData {
    date: string;
    totalUp: number;
    totalDown: number;
    percentUp: number;
    percentDown: number;
    totalVotes: number;
}

export interface HistoryStats {
    total: number;
    won: number;
    lost: number;
    pending: number;
    accuracy: number;
    currentStreak: number;
    bestStreak: number;
    totalEarned: number;
    totalPenalty: number;
}

export interface PredictionRow {
    id: string;
    targetDate: string;
    direction: 'up' | 'down';
    status: 'pending' | 'won' | 'lost' | 'refund';
    reward: number | null;
    penalty: number | null;
    actualDirection: string | null;
    actualChange: string | null;
    streakAfter: number | null;
    predictedAt: string;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatar: string | null;
    totalCorrect: number;
    totalPredictions: number;
    accuracy: number;
    bestStreak: number;
    totalEarned: number;
}

export type TabId = 'prices' | 'history' | 'leaderboard';
