// Real stock price API using Tiingo
// Fetches actual historical stock data with modern fetch

const TIINGO_API_TOKEN = process.env.TIINGO_API_TOKEN
const TIINGO_BASE_URL = 'https://api.tiingo.com/tiingo/daily'

export interface StockPrice {
  ticker: string
  date: string // YYYY-MM-DD format
  price: number
}

export interface TiingoResponse {
  date: string // ISO 8601 format
  close: number
  high: number
  low: number
  open: number
  volume: number
  adjClose: number
  adjHigh: number
  adjLow: number
  adjOpen: number
  adjVolume: number
  divCash: number
  splitFactor: number
}

// Helper function to format date for API calls
function formatDateForAPI(date: string): string {
  return date // Tiingo accepts YYYY-MM-DD format
}

// Helper function to parse ISO date to YYYY-MM-DD
function parseApiDate(isoDate: string): string {
  return isoDate.split('T')[0]
}

// Fetch historical prices for a single ticker within a date range
async function fetchTickerPrices(ticker: string, startDate: string, endDate: string): Promise<StockPrice[]> {
  const url = `${TIINGO_BASE_URL}/${ticker.toLowerCase()}/prices?startDate=${formatDateForAPI(startDate)}&endDate=${formatDateForAPI(endDate)}&token=${TIINGO_API_TOKEN}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch ${ticker} prices: ${response.status} ${response.statusText}`)
      return []
    }
    
    const data: TiingoResponse[] = await response.json()
    
    return data.map(item => ({
      ticker: ticker.toUpperCase(),
      date: parseApiDate(item.date),
      price: item.adjClose || item.close // Use adjusted close price, fallback to close
    }))
  } catch (error) {
    console.error(`Error fetching ${ticker} prices:`, error)
    return []
  }
}

// Get price for a specific ticker and date (with fallback to nearest date)
export async function getStockPrice(ticker: string, date: string): Promise<number> {
  // For single date requests, fetch a small range around the date
  const targetDate = new Date(date)
  const startDate = new Date(targetDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days before
  const endDate = new Date(targetDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days after
  
  const prices = await fetchTickerPrices(
    ticker, 
    startDate.toISOString().split('T')[0], 
    endDate.toISOString().split('T')[0]
  )
  
  // Find exact match first
  const exactMatch = prices.find(p => p.date === date)
  if (exactMatch) return exactMatch.price
  
  // Find closest previous date
  const previousPrices = prices
    .filter(p => new Date(p.date) <= targetDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  if (previousPrices.length > 0) {
    return previousPrices[0].price
  }
  
  // If no previous price found, try any available price
  if (prices.length > 0) {
    return prices[0].price
  }
  
  console.warn(`No price data found for ${ticker} around ${date}`)
  return 0
}

// Efficient batch price fetching - optimized for minimal API calls
export async function batchGetStockPrices(requests: Array<{ ticker: string; date: string }>): Promise<Record<string, Record<string, number>>> {
  if (requests.length === 0) {
    return {}
  }
  
  // Group requests by ticker to minimize API calls
  const requestsByTicker: Record<string, string[]> = {}
  requests.forEach(({ ticker, date }) => {
    if (!requestsByTicker[ticker]) {
      requestsByTicker[ticker] = []
    }
    requestsByTicker[ticker].push(date)
  })
  
  // Determine date range for each ticker
  const tickerRanges: Record<string, { startDate: string; endDate: string }> = {}
  Object.entries(requestsByTicker).forEach(([ticker, dates]) => {
    const sortedDates = dates.sort()
    tickerRanges[ticker] = {
      startDate: sortedDates[0],
      endDate: sortedDates[sortedDates.length - 1]
    }
  })
  
  // Fetch all ticker price ranges in parallel with rate limiting
  const tickers = Object.keys(tickerRanges)
  const priceCache: Record<string, Record<string, number>> = {}
  
  // Process tickers in batches to avoid overwhelming the API
  const BATCH_SIZE = 5 // Process 5 tickers at a time
  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE)
    
    const batchPromises = batch.map(async (ticker) => {
      const { startDate, endDate } = tickerRanges[ticker]
      const prices = await fetchTickerPrices(ticker, startDate, endDate)
      
      // Initialize cache for this ticker
      priceCache[ticker] = {}
      
      // Store all available prices
      prices.forEach(price => {
        priceCache[ticker][price.date] = price.price
      })
      
      return ticker
    })
    
    await Promise.all(batchPromises)
    
    // Add a small delay between batches to be respectful to the API
    if (i + BATCH_SIZE < tickers.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  // Fill in missing dates with nearest available prices
  requests.forEach(({ ticker, date }) => {
    if (!priceCache[ticker]) {
      priceCache[ticker] = {}
    }
    
    if (!priceCache[ticker][date]) {
      // Find closest available price for this ticker
      const availableDates = Object.keys(priceCache[ticker]).sort()
      const targetDate = new Date(date)
      
      // Find closest previous date
      const previousDates = availableDates
        .filter(d => new Date(d) <= targetDate)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      
      if (previousDates.length > 0) {
        priceCache[ticker][date] = priceCache[ticker][previousDates[0]]
      } else if (availableDates.length > 0) {
        // Fallback to first available price
        priceCache[ticker][date] = priceCache[ticker][availableDates[0]]
      } else {
        console.warn(`No price data available for ${ticker}`)
        priceCache[ticker][date] = 0
      }
    }
  })
  
  return priceCache
}

// Legacy function for compatibility - generates historical prices
export async function generateHistoricalPrices(): Promise<StockPrice[]> {
  console.warn('generateHistoricalPrices is deprecated. Use batchGetStockPrices for better performance.')
  
  // This would be very inefficient with real API, but keeping for compatibility
  const tickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META']
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const allPrices: StockPrice[] = []
  
  for (const ticker of tickers) {
    const prices = await fetchTickerPrices(ticker, startDate, endDate)
    allPrices.push(...prices)
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return allPrices
}
