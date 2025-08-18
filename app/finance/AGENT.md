# Finance Page - AI Agent Context

## Overview

This is a **Portfolio Finance Tracker** page (`/finance`) that calculates and displays portfolio value over time based on stock holdings and historical stock prices. The page shows a line chart of portfolio value, current statistics, top holdings, and performance returns across different time periods.

## Architecture & Design Decisions

### **Efficient Data Fetching Architecture**
The system is designed for **maximum efficiency** with real APIs in mind:

1. **Single Holdings Fetch**: Holdings data fetched once from database (async)
2. **Batch Price Fetching**: All needed stock prices fetched in one API call
3. **Synchronous Calculations**: All portfolio calculations use cached data (no additional API calls)

### **Server Components & Async Data**
- Main page is a **server component** with proper metadata
- All data fetching happens on the server for better performance and SEO
- Chart rendering uses a separate **client component** (recharts requires client-side)

## File Structure

```
app/finance/
├── AGENT.md                 # This context file
├── page.tsx                 # Main server component page
├── portfolio-chart.tsx      # Client component for recharts visualization
├── holdings-data.ts         # Mock holdings data + async fetcher
├── mock-stock-api.ts        # Mock stock price API + batch fetcher
└── portfolio-calculator.ts  # Core calculation logic
```

## File Details

### `holdings-data.ts`
- **Mock Data**: Demo stock holdings with purchase/sale history
- **Data Structure**: `{ ticker: string, shares: number, date: string }`
- **Key Function**: `getHoldingsData()` - async function ready for database integration
- **Future**: Replace mock with real database query

```typescript
// Current: Mock data
export async function getHoldingsData(): Promise<StockHolding[]> {
  await new Promise(resolve => setTimeout(resolve, 25)) // Simulate DB delay
  return holdingsData
}

// Future: Real database
export async function getHoldingsData(): Promise<StockHolding[]> {
  const holdings = await db.holdings.findMany({ orderBy: { date: 'asc' } })
  return holdings
}
```

### `mock-stock-api.ts`
- **Mock Prices**: Historical stock prices for major tickers (AAPL, GOOGL, etc.)
- **Interpolation**: Generates daily prices between key dates with realistic variation
- **Key Function**: `batchGetStockPrices()` - efficient batch fetching
- **Future**: Replace with real stock API (Alpha Vantage, Yahoo Finance, etc.)

```typescript
// Efficient batch API call - fetches all needed prices at once
export async function batchGetStockPrices(
  requests: Array<{ ticker: string; date: string }>
): Promise<Record<string, Record<string, number>>>
```

### `portfolio-calculator.ts`
- **Core Logic**: All portfolio calculations and data processing
- **Main Function**: `getCompletePortfolioData()` - single entry point for all data
- **Architecture**: Fetch once, calculate everything synchronously

#### Key Functions:
1. `getCompletePortfolioData()` - **USE THIS** for all data needs
2. Legacy functions (kept for compatibility, marked as deprecated)

### `portfolio-chart.tsx`
- **Client Component**: Handles recharts line chart rendering
- **Props**: Takes `portfolioHistory` array
- **Features**: Interactive tooltips, responsive design, dark mode support

### `page.tsx`
- **Server Component**: Main page with metadata and async data fetching
- **Data Flow**: Calls `getCompletePortfolioData()` once, passes data to components
- **UI**: Statistics cards, chart, holdings table, performance summary

## Data Flow Architecture

```
1. Holdings Fetch (1 async call)
   └── getHoldingsData() → StockHolding[]

2. Analysis Planning (sync)
   └── generateAnalysisDates() → string[]
   └── createPriceRequests() → { ticker, date }[]

3. Price Batch Fetch (1 async call)
   └── batchGetStockPrices() → Record<ticker, Record<date, price>>

4. Calculations (all sync, using cached data)
   ├── generatePortfolioHistorySync() → PortfolioValue[]
   ├── getCurrentPortfolioStatsSync() → CurrentStats
   └── calculateReturnsSync() → Returns
```

## Key Technical Decisions

### **Why Batch Processing?**
- **Problem**: Original approach made 100+ separate API calls
- **Solution**: Single batch call fetches all needed prices
- **Benefit**: Massive performance improvement, API rate limit friendly

### **Why Async Holdings?**
- **Requirement**: Holdings data must come from database eventually
- **Design**: All functions accept holdings as parameter (no global state)
- **Benefit**: Database-ready architecture, testable functions

### **Why Server Components?**
- **SEO**: Portfolio data indexed by search engines
- **Performance**: Data fetching happens on server
- **UX**: Faster initial page load

## Adding New Features

### **Add New Stock Ticker**
1. Add entries to `holdingsData` in `holdings-data.ts`
2. Add price data to `mockPrices` in `mock-stock-api.ts`

### **Add New Chart Type**
1. Create new client component (copy pattern from `portfolio-chart.tsx`)
2. Pass data from `page.tsx` to new component
3. Use recharts or other client-side charting library

### **Add New Calculation**
1. Add function to `portfolio-calculator.ts`
2. Accept `holdingsData` and `priceCache` as parameters
3. Call from `getCompletePortfolioData()` and return in result object

## Database Integration (Future)

### **Holdings Table Schema**
```sql
CREATE TABLE holdings (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL,
  shares DECIMAL(10,4) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Stock Prices API Integration**
Popular options:
- **Alpha Vantage**: Free tier, good for historical data
- **Yahoo Finance**: Unofficial APIs available
- **IEX Cloud**: Professional API with good pricing
- **Polygon.io**: Real-time and historical data

## Performance Considerations

### **Current Performance**
- **Mock Data**: ~75ms total (25ms holdings + 50ms batch prices)
- **Calculations**: <5ms (all synchronous with cached data)

### **Real API Performance**
- **Database Query**: Should be <10ms with proper indexing
- **Stock API**: Varies by provider, batch calls recommended
- **Caching**: Consider Redis for price data caching

## Common Tasks

### **Update Mock Data**
- Edit `holdingsData` array in `holdings-data.ts`
- Add corresponding prices to `mockPrices` in `mock-stock-api.ts`

### **Debug Calculations**
- All calculation functions are pure (no side effects)
- Pass mock data directly to test specific scenarios
- Use `calculatePortfolioValueForDateSync()` to test single dates

### **Modify UI**
- Statistics cards: Edit `page.tsx` directly
- Chart styling: Modify `portfolio-chart.tsx`
- Add new sections: Follow existing patterns in `page.tsx`

## Testing Strategy

### **Unit Tests** (recommended)
- Test calculation functions with known input/output
- Mock `getHoldingsData()` and `batchGetStockPrices()`
- Verify portfolio value calculations

### **Integration Tests**
- Test complete data flow with mock APIs
- Verify chart renders with sample data
- Test edge cases (empty holdings, missing prices)

## Future Enhancements

### **Immediate**
- [ ] Add loading states for async operations
- [ ] Error handling for API failures
- [ ] Add more chart types (pie chart for allocation)

### **Medium Term**
- [ ] Real database integration
- [ ] Real stock price API
- [ ] User authentication (personal portfolios)
- [ ] Portfolio comparison features

### **Long Term**
- [ ] Real-time price updates
- [ ] Multiple portfolio support
- [ ] Advanced analytics (Sharpe ratio, beta, etc.)
- [ ] Export functionality (PDF reports)

## Dependencies

### **Required**
- `recharts`: Chart visualization
- Next.js app router with server components

### **Future Database Options**
- PostgreSQL + Prisma (recommended)
- Supabase (PostgreSQL with built-in auth)
- PlanetScale (MySQL-compatible)

## Notes for AI Agents

1. **Always use** `getCompletePortfolioData()` for data fetching
2. **Maintain** the async/sync separation pattern
3. **Test** with TypeScript compilation before suggesting changes
4. **Consider** API rate limits when modifying batch fetching logic
5. **Preserve** the efficient caching architecture
6. **Add** proper error handling for production use

This architecture is optimized for performance and ready for production database integration.
