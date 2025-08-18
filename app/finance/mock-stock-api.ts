// Mock stock price API for historical data
// In a real app, this would fetch from Yahoo Finance, Alpha Vantage, or similar

export interface StockPrice {
  ticker: string
  date: string // YYYY-MM-DD format
  price: number
}

// Mock historical stock prices (simplified/estimated for demo)
const mockPrices: Record<string, Record<string, number>> = {
  AAPL: {
    '2023-01-15': 150.47,
    '2023-02-01': 145.43,
    '2023-03-01': 165.12,
    '2023-03-10': 152.99,
    '2023-04-01': 169.18,
    '2023-05-01': 176.76,
    '2023-06-01': 180.96,
    '2023-07-01': 193.89,
    '2023-08-01': 196.24,
    '2023-09-01': 189.46,
    '2023-10-01': 170.77,
    '2023-11-01': 176.65,
    '2023-12-01': 191.24,
    '2024-01-01': 185.64,
    '2024-01-08': 182.01,
    '2024-02-01': 186.86,
    '2024-02-14': 181.16,
    '2024-03-01': 180.75,
    '2024-03-20': 178.67,
    '2024-04-01': 170.85,
    '2024-05-01': 191.04,
    '2024-05-10': 183.38,
    '2024-06-01': 194.48,
    '2024-06-18': 188.01,
    '2024-07-01': 221.27,
    '2024-07-22': 218.54,
    '2024-08-01': 218.36,
    '2024-09-01': 222.77,
    '2024-09-05': 220.82,
    '2024-10-01': 226.47,
    '2024-10-12': 227.52,
    '2024-11-01': 222.48,
    '2024-12-01': 224.31,
  },
  GOOGL: {
    '2023-01-20': 88.73,
    '2023-02-01': 97.71,
    '2023-03-01': 91.04,
    '2023-04-01': 105.68,
    '2023-05-01': 109.78,
    '2023-06-01': 120.99,
    '2023-06-15': 123.37,
    '2023-07-01': 120.26,
    '2023-08-01': 130.78,
    '2023-09-01': 134.93,
    '2023-10-01': 121.09,
    '2023-11-01': 125.30,
    '2023-12-01': 140.93,
    '2024-01-01': 140.24,
    '2024-02-01': 144.81,
    '2024-03-01': 138.21,
    '2024-04-01': 157.47,
    '2024-05-01': 173.54,
    '2024-05-10': 170.37,
    '2024-06-01': 174.72,
    '2024-07-01': 183.63,
    '2024-08-01': 165.84,
    '2024-09-01': 160.33,
    '2024-10-01': 166.80,
    '2024-11-01': 171.69,
    '2024-12-01': 175.35,
  },
  MSFT: {
    '2023-01-25': 247.81,
    '2023-02-01': 252.75,
    '2023-03-01': 252.32,
    '2023-04-01': 289.86,
    '2023-05-01': 318.52,
    '2023-06-01': 335.02,
    '2023-07-01': 356.82,
    '2023-08-01': 325.12,
    '2023-08-20': 327.89,
    '2023-09-01': 315.75,
    '2023-10-01': 337.89,
    '2023-11-01': 365.85,
    '2023-12-01': 374.51,
    '2024-01-01': 376.04,
    '2024-02-01': 408.81,
    '2024-03-01': 420.72,
    '2024-04-01': 398.53,
    '2024-05-01': 416.42,
    '2024-06-01': 451.24,
    '2024-07-01': 446.34,
    '2024-08-01': 421.59,
    '2024-09-01': 417.65,
    '2024-09-05': 415.73,
    '2024-10-01': 416.06,
    '2024-11-01': 406.31,
    '2024-12-01': 423.85,
  },
  TSLA: {
    '2023-04-05': 185.06,
    '2023-05-01': 164.31,
    '2023-06-01': 203.93,
    '2023-07-01': 269.79,
    '2023-08-01': 258.08,
    '2023-09-01': 250.22,
    '2023-09-25': 244.12,
    '2023-10-01': 242.68,
    '2023-11-01': 207.30,
    '2023-12-01': 253.18,
    '2024-01-01': 238.45,
    '2024-02-01': 181.06,
    '2024-03-01': 202.64,
    '2024-04-01': 162.99,
    '2024-05-01': 181.79,
    '2024-06-01': 177.48,
    '2024-06-18': 181.47,
    '2024-07-01': 209.86,
    '2024-08-01': 219.16,
    '2024-09-01': 250.83,
    '2024-10-01': 240.83,
    '2024-11-01': 251.44,
    '2024-12-01': 352.56,
  },
  NVDA: {
    '2023-04-12': 277.77,
    '2023-05-01': 305.87,
    '2023-06-01': 378.34,
    '2023-07-01': 433.99,
    '2023-08-01': 467.95,
    '2023-09-01': 436.58,
    '2023-10-01': 430.89,
    '2023-11-01': 467.71,
    '2023-11-15': 504.20,
    '2023-12-01': 467.69,
    '2024-01-01': 481.28,
    '2024-02-01': 661.59,
    '2024-03-01': 788.17,
    '2024-04-01': 833.45,
    '2024-05-01': 884.69,
    '2024-06-01': 1208.88,
    '2024-07-01': 1037.99,
    '2024-07-22': 1013.58,
    '2024-08-01': 100.45, // Stock split adjustment
    '2024-09-01': 108.84,
    '2024-10-01': 132.65,
    '2024-11-01': 135.72,
    '2024-12-01': 140.15,
  },
  AMZN: {
    '2023-10-10': 127.12,
    '2023-11-01': 133.97,
    '2023-12-01': 151.94,
    '2024-01-01': 155.24,
    '2024-02-01': 153.75,
    '2024-02-14': 155.93,
    '2024-03-01': 180.38,
    '2024-04-01': 179.83,
    '2024-05-01': 183.51,
    '2024-06-01': 181.05,
    '2024-07-01': 188.44,
    '2024-08-01': 176.39,
    '2024-09-01': 189.87,
    '2024-10-01': 186.40,
    '2024-11-01': 197.93,
    '2024-12-01': 206.08,
  },
  META: {
    '2024-03-20': 493.50,
    '2024-04-01': 493.56,
    '2024-05-01': 460.23,
    '2024-06-01': 507.34,
    '2024-07-01': 503.69,
    '2024-08-01': 527.34,
    '2024-09-01': 568.31,
    '2024-10-01': 582.77,
    '2024-10-12': 595.94,
    '2024-11-01': 563.33,
    '2024-12-01': 581.16,
  },
}

// Generate daily prices by interpolating between key dates
function interpolatePrice(ticker: string, startDate: string, endDate: string, startPrice: number, endPrice: number): StockPrice[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const priceStep = (endPrice - startPrice) / days
  
  const prices: StockPrice[] = []
  
  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
    const price = startPrice + (priceStep * i) + (Math.random() - 0.5) * startPrice * 0.02 // Add small random variation
    
    prices.push({
      ticker,
      date: currentDate.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100
    })
  }
  
  return prices
}

// Generate complete historical price data
export async function generateHistoricalPrices(): Promise<StockPrice[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 10))
  
  const allPrices: StockPrice[] = []
  
  Object.entries(mockPrices).forEach(([ticker, pricePoints]) => {
    const dates = Object.keys(pricePoints).sort()
    
    for (let i = 0; i < dates.length - 1; i++) {
      const startDate = dates[i]
      const endDate = dates[i + 1]
      const startPrice = pricePoints[startDate]
      const endPrice = pricePoints[endDate]
      
      const interpolatedPrices = interpolatePrice(ticker, startDate, endDate, startPrice, endPrice)
      allPrices.push(...interpolatedPrices)
    }
    
    // Add the last price point
    const lastDate = dates[dates.length - 1]
    allPrices.push({
      ticker,
      date: lastDate,
      price: pricePoints[lastDate]
    })
  })
  
  return allPrices
}

// Get price for a specific ticker and date (with fallback to nearest date)
export async function getStockPrice(ticker: string, date: string): Promise<number> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 5))
  
  const prices = (await generateHistoricalPrices()).filter(p => p.ticker === ticker)
  
  // Find exact match first
  const exactMatch = prices.find(p => p.date === date)
  if (exactMatch) return exactMatch.price
  
  // Find closest previous date
  const targetDate = new Date(date)
  const previousPrices = prices
    .filter(p => new Date(p.date) <= targetDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  return previousPrices[0]?.price || mockPrices[ticker]?.[Object.keys(mockPrices[ticker])[0]] || 100
}

// Efficient batch price fetching - gets all needed prices in one call
export async function batchGetStockPrices(requests: Array<{ ticker: string; date: string }>): Promise<Record<string, Record<string, number>>> {
  // Simulate network delay for batch request
  await new Promise(resolve => setTimeout(resolve, 50))
  
  const allPrices = await generateHistoricalPrices()
  const priceCache: Record<string, Record<string, number>> = {}
  
  // Group prices by ticker for efficient lookup
  const pricesByTicker: Record<string, StockPrice[]> = {}
  allPrices.forEach(price => {
    if (!pricesByTicker[price.ticker]) {
      pricesByTicker[price.ticker] = []
    }
    pricesByTicker[price.ticker].push(price)
  })
  
  // Process each request
  requests.forEach(({ ticker, date }) => {
    if (!priceCache[ticker]) {
      priceCache[ticker] = {}
    }
    
    const tickerPrices = pricesByTicker[ticker] || []
    
    // Find exact match first
    const exactMatch = tickerPrices.find(p => p.date === date)
    if (exactMatch) {
      priceCache[ticker][date] = exactMatch.price
      return
    }
    
    // Find closest previous date
    const targetDate = new Date(date)
    const previousPrices = tickerPrices
      .filter(p => new Date(p.date) <= targetDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    priceCache[ticker][date] = previousPrices[0]?.price || mockPrices[ticker]?.[Object.keys(mockPrices[ticker])[0]] || 100
  })
  
  return priceCache
}
