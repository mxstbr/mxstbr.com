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
  
  // If no data exists in Redis, return empty array
  return []
}

// Add a new holding entry
export async function addHolding(holding: StockHolding): Promise<void> {
  try {
    const currentHoldings = await getHoldingsData()
    const newHoldings = [...currentHoldings, holding]
    await storeHoldingsData(newHoldings)
  } catch (error) {
    console.error('Error adding holding:', error)
    throw new Error('Failed to add holding')
  }
}

// Update an existing holding entry
export async function updateHolding(index: number, updatedHolding: StockHolding): Promise<void> {
  try {
    const currentHoldings = await getHoldingsData()
    if (index < 0 || index >= currentHoldings.length) {
      throw new Error('Invalid holding index')
    }
    
    currentHoldings[index] = updatedHolding
    await storeHoldingsData(currentHoldings)
  } catch (error) {
    console.error('Error updating holding:', error)
    throw new Error('Failed to update holding')
  }
}

// Delete a holding entry
export async function deleteHolding(index: number): Promise<void> {
  try {
    const currentHoldings = await getHoldingsData()
    if (index < 0 || index >= currentHoldings.length) {
      throw new Error('Invalid holding index')
    }
    
    currentHoldings.splice(index, 1)
    await storeHoldingsData(currentHoldings)
  } catch (error) {
    console.error('Error deleting holding:', error)
    throw new Error('Failed to delete holding')
  }
}

// Get holding by index
export async function getHoldingByIndex(index: number): Promise<StockHolding | null> {
  try {
    const holdings = await getHoldingsData()
    return holdings[index] || null
  } catch (error) {
    console.error('Error getting holding by index:', error)
    return null
  }
}