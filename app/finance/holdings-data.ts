// Demo stock holdings data
// Each entry represents holdings at a specific date
// If there's a purchase/sale, a new entry is added with the updated holdings

export interface StockHolding {
  ticker: string
  shares: number
  date: string // YYYY-MM-DD format
}

const holdingsData: StockHolding[] = [
  // Initial purchases in January 2023
  { ticker: 'AAPL', shares: 50, date: '2023-01-15' },
  { ticker: 'GOOGL', shares: 20, date: '2023-01-20' },
  { ticker: 'MSFT', shares: 30, date: '2023-01-25' },
  
  // Additional AAPL purchase in March
  { ticker: 'AAPL', shares: 75, date: '2023-03-10' },
  
  // New positions in April
  { ticker: 'TSLA', shares: 15, date: '2023-04-05' },
  { ticker: 'NVDA', shares: 25, date: '2023-04-12' },
  
  // Increased GOOGL position in June
  { ticker: 'GOOGL', shares: 35, date: '2023-06-15' },
  
  // Added more MSFT in August
  { ticker: 'MSFT', shares: 45, date: '2023-08-20' },
  
  // Sold some TSLA in September
  { ticker: 'TSLA', shares: 10, date: '2023-09-25' },
  
  // Added AMZN position in October
  { ticker: 'AMZN', shares: 20, date: '2023-10-10' },
  
  // Increased NVDA position in November
  { ticker: 'NVDA', shares: 40, date: '2023-11-15' },
  
  // Recent adjustments in 2024
  { ticker: 'AAPL', shares: 100, date: '2024-01-08' },
  { ticker: 'AMZN', shares: 35, date: '2024-02-14' },
  { ticker: 'META', shares: 25, date: '2024-03-20' },
  
  // More recent changes
  { ticker: 'GOOGL', shares: 50, date: '2024-05-10' },
  { ticker: 'TSLA', shares: 20, date: '2024-06-18' },
  { ticker: 'NVDA', shares: 60, date: '2024-07-22' },
  
  // Latest updates
  { ticker: 'MSFT', shares: 55, date: '2024-09-05' },
  { ticker: 'META', shares: 35, date: '2024-10-12' },
  { ticker: 'AAPL', shares: 120, date: '2024-11-01' },
]

// Async function to fetch holdings data (mock for now, will connect to DB later)
export async function getHoldingsData(): Promise<StockHolding[]> {
  // Simulate database query delay
  await new Promise(resolve => setTimeout(resolve, 25))
  
  // In the future, this would be:
  // const holdings = await db.holdings.findMany({ 
  //   orderBy: { date: 'asc' } 
  // })
  // return holdings
  
  return holdingsData
}
