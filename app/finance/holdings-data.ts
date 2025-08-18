import { Redis } from '@upstash/redis'

// Redis client initialization
const redis = Redis.fromEnv()

// Stock holdings data structure
export interface StockHolding {
  ticker: string
  shares: number
  date: string // YYYY-MM-DD format
}

// Redis key for storing holdings data
const HOLDINGS_KEY = 'finance:holdings'

// Store holdings data in Redis
export async function storeHoldingsData(holdings: StockHolding[]): Promise<void> {
  try {
    // Store as JSON string, following pattern from other parts of the codebase
    await redis.set(HOLDINGS_KEY, holdings)
  } catch (error) {
    console.error('Error storing holdings data in Redis:', error)
    throw new Error('Failed to store holdings data')
  }
}

// Fetch holdings data from Redis
export async function getHoldingsData(): Promise<StockHolding[]> {
  // Let Upstash Redis handle JSON serialization automatically
  const data = await redis.get<StockHolding[]>(HOLDINGS_KEY)
  
  if (data && Array.isArray(data)) {
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
  
  // If no data exists in Redis, seed it with default data and return
  throw new Error('No holdings data found in Redis, seeding with default data')
}