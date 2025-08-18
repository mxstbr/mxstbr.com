import { type StockHolding, getHoldingsData } from './holdings-data'
import { getStockPrice, batchGetStockPrices } from './tiingo-api'

export interface PortfolioValue {
  date: string
  totalValue: number
  holdings: Record<string, { shares: number; value: number; price: number }>
}

// Get holdings for a specific date (uses the most recent holding data up to that date)
function getHoldingsForDate(date: string, holdingsData: StockHolding[]): Record<string, number> {
  const targetDate = new Date(date)
  const holdings: Record<string, number> = {}
  
  // Sort holdings by date
  const sortedHoldings = holdingsData
    .filter(h => new Date(h.date) <= targetDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Build holdings map, with later entries overriding earlier ones for the same ticker
  sortedHoldings.forEach(holding => {
    holdings[holding.ticker] = holding.shares
  })
  
  return holdings
}

// Calculate portfolio value for a specific date (legacy function, use getCompletePortfolioData instead)
export async function calculatePortfolioValueForDate(date: string): Promise<PortfolioValue> {
  const holdingsData = await getHoldingsData()
  const holdings = getHoldingsForDate(date, holdingsData)
  const holdingsDetail: Record<string, { shares: number; value: number; price: number }> = {}
  let totalValue = 0
  
  // Process holdings in parallel for better performance
  const holdingPromises = Object.entries(holdings).map(async ([ticker, shares]) => {
    const price = await getStockPrice(ticker, date)
    const value = shares * price
    
    return {
      ticker,
      shares,
      value,
      price
    }
  })
  
  const holdingResults = await Promise.all(holdingPromises)
  
  holdingResults.forEach(({ ticker, shares, value, price }) => {
    holdingsDetail[ticker] = {
      shares,
      value,
      price
    }
    totalValue += value
  })
  
  return {
    date,
    totalValue,
    holdings: holdingsDetail
  }
}

// Generate portfolio value history over a date range (legacy function, use getCompletePortfolioData instead)
export async function generatePortfolioHistory(startDate: string, endDate: string): Promise<PortfolioValue[]> {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const history: PortfolioValue[] = []
  
  // Generate dates for every week to reduce computation while maintaining good resolution
  const dates: string[] = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 7)
  }
  
  // Always include the end date
  if (dates.length === 0 || dates[dates.length - 1] !== endDate) {
    dates.push(endDate)
  }
  
  // Process all dates in parallel for better performance
  const portfolioPromises = dates.map(async (dateStr) => {
    const portfolioValue = await calculatePortfolioValueForDate(dateStr)
    return portfolioValue.totalValue > 0 ? portfolioValue : null
  })
  
  const portfolioResults = await Promise.all(portfolioPromises)
  
  // Filter out null results (dates with no holdings)
  portfolioResults.forEach(result => {
    if (result) {
      history.push(result)
    }
  })
  
  return history
}

// Get current portfolio statistics (legacy function, use getCompletePortfolioData instead)
export async function getCurrentPortfolioStats(): Promise<{
  totalValue: number
  totalShares: Record<string, number>
  topHoldings: Array<{ ticker: string; value: number; percentage: number }>
}> {
  const today = new Date().toISOString().split('T')[0]
  const currentPortfolio = await calculatePortfolioValueForDate(today)
  
  const topHoldings = Object.entries(currentPortfolio.holdings)
    .map(([ticker, data]) => ({
      ticker,
      value: data.value,
      percentage: (data.value / currentPortfolio.totalValue) * 100
    }))
    .sort((a, b) => b.value - a.value)
  
  const totalShares = Object.entries(currentPortfolio.holdings).reduce(
    (acc, [ticker, data]) => ({
      ...acc,
      [ticker]: data.shares
    }),
    {} as Record<string, number>
  )
  
  return {
    totalValue: currentPortfolio.totalValue,
    totalShares,
    topHoldings
  }
}

// Calculate returns over different time periods (legacy function, use getCompletePortfolioData instead)
export async function calculateReturns(): Promise<{
  oneMonth: number
  threeMonths: number
  sixMonths: number
  oneYear: number
  inception: number
}> {
  const holdingsData = await getHoldingsData()
  const today = new Date()
  const currentValue = (await calculatePortfolioValueForDate(today.toISOString().split('T')[0])).totalValue
  
  const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
  
  // Find the first date with holdings for inception calculation
  const firstHoldingDate = holdingsData
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date
  
  // Process all historical calculations in parallel
  const [oneMonthValue, threeMonthValue, sixMonthValue, oneYearValue, inceptionValue] = await Promise.all([
    calculatePortfolioValueForDate(oneMonthAgo.toISOString().split('T')[0]).then(p => p.totalValue),
    calculatePortfolioValueForDate(threeMonthsAgo.toISOString().split('T')[0]).then(p => p.totalValue),
    calculatePortfolioValueForDate(sixMonthsAgo.toISOString().split('T')[0]).then(p => p.totalValue),
    calculatePortfolioValueForDate(oneYearAgo.toISOString().split('T')[0]).then(p => p.totalValue),
    firstHoldingDate ? calculatePortfolioValueForDate(firstHoldingDate).then(p => p.totalValue) : Promise.resolve(currentValue)
  ])
  
  return {
    oneMonth: oneMonthValue > 0 ? ((currentValue - oneMonthValue) / oneMonthValue) * 100 : 0,
    threeMonths: threeMonthValue > 0 ? ((currentValue - threeMonthValue) / threeMonthValue) * 100 : 0,
    sixMonths: sixMonthValue > 0 ? ((currentValue - sixMonthValue) / sixMonthValue) * 100 : 0,
    oneYear: oneYearValue > 0 ? ((currentValue - oneYearValue) / oneYearValue) * 100 : 0,
    inception: inceptionValue > 0 ? ((currentValue - inceptionValue) / inceptionValue) * 100 : 0,
  }
}

// EFFICIENT BATCH DATA FETCHING APPROACH
// =====================================

// Helper function to get all unique tickers from holdings data
function getAllTickers(holdingsData: StockHolding[]): string[] {
  return Array.from(new Set(holdingsData.map(h => h.ticker)))
}

// Generate all dates we need for analysis
function generateAnalysisDates(startDate: string, endDate: string, holdingsData: StockHolding[]): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Weekly intervals for portfolio history
  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 7)
  }
  
  // Always include the end date
  if (dates[dates.length - 1] !== endDate) {
    dates.push(endDate)
  }
  
  // Add specific dates for returns calculation
  const today = new Date()
  const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
  
  const returnsDates = [
    today.toISOString().split('T')[0],
    oneMonthAgo.toISOString().split('T')[0],
    threeMonthsAgo.toISOString().split('T')[0],
    sixMonthsAgo.toISOString().split('T')[0],
    oneYearAgo.toISOString().split('T')[0]
  ]
  
  // Add first holding date for inception calculation
  const firstHoldingDate = holdingsData
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date
  if (firstHoldingDate) {
    returnsDates.push(firstHoldingDate)
  }
  
  // Combine all dates and remove duplicates
  const allDates = Array.from(new Set([...dates, ...returnsDates]))
  return allDates.sort()
}

// Create price requests for all tickers and dates we need
function createPriceRequests(dates: string[], holdingsData: StockHolding[]): Array<{ ticker: string; date: string }> {
  const tickers = getAllTickers(holdingsData)
  const requests: Array<{ ticker: string; date: string }> = []
  
  dates.forEach(date => {
    tickers.forEach(ticker => {
      requests.push({ ticker, date })
    })
  })
  
  return requests
}

// Synchronous version of calculatePortfolioValueForDate using cached prices
function calculatePortfolioValueForDateSync(date: string, priceCache: Record<string, Record<string, number>>, holdingsData: StockHolding[]): PortfolioValue {
  const holdings = getHoldingsForDate(date, holdingsData)
  const holdingsDetail: Record<string, { shares: number; value: number; price: number }> = {}
  let totalValue = 0
  
  Object.entries(holdings).forEach(([ticker, shares]) => {
    const price = priceCache[ticker]?.[date] || 0
    const value = shares * price
    
    holdingsDetail[ticker] = {
      shares,
      value,
      price
    }
    
    totalValue += value
  })
  
  return {
    date,
    totalValue,
    holdings: holdingsDetail
  }
}

// Synchronous version of generatePortfolioHistory using cached prices
function generatePortfolioHistorySync(startDate: string, endDate: string, priceCache: Record<string, Record<string, number>>, holdingsData: StockHolding[]): PortfolioValue[] {
  const dates = generateAnalysisDates(startDate, endDate, holdingsData)
  const history: PortfolioValue[] = []
  
  dates.forEach(date => {
    const portfolioValue = calculatePortfolioValueForDateSync(date, priceCache, holdingsData)
    if (portfolioValue.totalValue > 0) {
      history.push(portfolioValue)
    }
  })
  
  return history
}

// Synchronous version of getCurrentPortfolioStats using cached prices
function getCurrentPortfolioStatsSync(priceCache: Record<string, Record<string, number>>, holdingsData: StockHolding[]): {
  totalValue: number
  totalShares: Record<string, number>
  topHoldings: Array<{ ticker: string; value: number; percentage: number }>
} {
  const today = new Date().toISOString().split('T')[0]
  const currentPortfolio = calculatePortfolioValueForDateSync(today, priceCache, holdingsData)
  
  const topHoldings = Object.entries(currentPortfolio.holdings)
    .map(([ticker, data]) => ({
      ticker,
      value: data.value,
      percentage: (data.value / currentPortfolio.totalValue) * 100
    }))
    .sort((a, b) => b.value - a.value)
  
  const totalShares = Object.entries(currentPortfolio.holdings).reduce(
    (acc, [ticker, data]) => ({
      ...acc,
      [ticker]: data.shares
    }),
    {} as Record<string, number>
  )
  
  return {
    totalValue: currentPortfolio.totalValue,
    totalShares,
    topHoldings
  }
}

// Synchronous version of calculateReturns using cached prices
function calculateReturnsSync(priceCache: Record<string, Record<string, number>>, holdingsData: StockHolding[]): {
  oneMonth: number
  threeMonths: number
  sixMonths: number
  oneYear: number
  inception: number
} {
  const today = new Date()
  const currentValue = calculatePortfolioValueForDateSync(today.toISOString().split('T')[0], priceCache, holdingsData).totalValue
  
  const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const threeMonthsAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)
  const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
  
  const firstHoldingDate = holdingsData
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date
  
  const oneMonthValue = calculatePortfolioValueForDateSync(oneMonthAgo.toISOString().split('T')[0], priceCache, holdingsData).totalValue
  const threeMonthValue = calculatePortfolioValueForDateSync(threeMonthsAgo.toISOString().split('T')[0], priceCache, holdingsData).totalValue
  const sixMonthValue = calculatePortfolioValueForDateSync(sixMonthsAgo.toISOString().split('T')[0], priceCache, holdingsData).totalValue
  const oneYearValue = calculatePortfolioValueForDateSync(oneYearAgo.toISOString().split('T')[0], priceCache, holdingsData).totalValue
  const inceptionValue = firstHoldingDate ? calculatePortfolioValueForDateSync(firstHoldingDate, priceCache, holdingsData).totalValue : currentValue
  
  return {
    oneMonth: oneMonthValue > 0 ? ((currentValue - oneMonthValue) / oneMonthValue) * 100 : 0,
    threeMonths: threeMonthValue > 0 ? ((currentValue - threeMonthValue) / threeMonthValue) * 100 : 0,
    sixMonths: sixMonthValue > 0 ? ((currentValue - sixMonthValue) / sixMonthValue) * 100 : 0,
    oneYear: oneYearValue > 0 ? ((currentValue - oneYearValue) / oneYearValue) * 100 : 0,
    inception: inceptionValue > 0 ? ((currentValue - inceptionValue) / inceptionValue) * 100 : 0,
  }
}

// Main efficient function that fetches all data once and calculates everything
export async function getCompletePortfolioData(startDate: string, endDate: string): Promise<{
  portfolioHistory: PortfolioValue[]
  currentStats: {
    totalValue: number
    totalShares: Record<string, number>
    topHoldings: Array<{ ticker: string; value: number; percentage: number }>
  }
  returns: {
    oneMonth: number
    threeMonths: number
    sixMonths: number
    oneYear: number
    inception: number
  }
}> {
  // 1. Fetch holdings data from database (async)
  const holdingsData = await getHoldingsData()
  
  // 2. Determine all dates we need based on holdings
  const dates = generateAnalysisDates(startDate, endDate, holdingsData)
  
  // 3. Create all price requests based on holdings and dates
  const priceRequests = createPriceRequests(dates, holdingsData)
  
  // 4. Fetch all prices in one batch call
  const priceCache = await batchGetStockPrices(priceRequests)
  
  // 5. Calculate everything synchronously using cached data
  const portfolioHistory = generatePortfolioHistorySync(startDate, endDate, priceCache, holdingsData)
  const currentStats = getCurrentPortfolioStatsSync(priceCache, holdingsData)
  const returns = calculateReturnsSync(priceCache, holdingsData)
  
  return {
    portfolioHistory,
    currentStats,
    returns
  }
}
