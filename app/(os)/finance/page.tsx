import { Metadata } from 'next'
import { getCompletePortfolioData } from './portfolio-calculator'
import Prose from 'app/components/prose'
import { size } from 'app/og/utils'
import { prodUrl } from 'app/sitemap'
import { addHolding, updateHolding, deleteHolding, getHoldingsData, type StockHolding } from './holdings-data'
import { revalidatePath } from 'next/cache'
import { HoldingEditForm, HoldingDeleteButton, AddHoldingForm, HoldingsListItem } from './holdings-crud'
import { notFound } from 'next/navigation'
import { isMax } from 'app/auth'
import PortfolioChart from './portfolio-chart'
import ReturnChart from './return-chart'
import { BlurredValue, MoneyVisibilityProvider } from './money-visibility'

// Utility function to format dollar values rounded to nearest dollar
function formatDollar(value: number): string {
  return Math.round(value).toLocaleString()
}

// Server actions for holdings CRUD operations
async function createHolding(formData: FormData): Promise<void> {
  'use server'
  
  const ticker = formData.get('ticker')?.toString()
  const shares = parseFloat(formData.get('shares')?.toString() || '0')
  const date = formData.get('date')?.toString()
  
  if (!ticker || !shares || !date) {
    throw new Error('Missing required fields')
  }
  
  const newHolding: StockHolding = {
    ticker: ticker.toUpperCase(),
    shares,
    date,
  }
  
  await addHolding(newHolding)
  revalidatePath('/finance')
}

async function editHolding(formData: FormData): Promise<void> {
  'use server'
  
  const index = parseInt(formData.get('index')?.toString() || '-1')
  const ticker = formData.get('ticker')?.toString()
  const shares = parseFloat(formData.get('shares')?.toString() || '0')
  const date = formData.get('date')?.toString()
  
  if (index < 0 || !ticker || !shares || !date) {
    throw new Error('Missing required fields or invalid index')
  }
  
  const updatedHolding: StockHolding = {
    ticker: ticker.toUpperCase(),
    shares,
    date,
  }
  
  await updateHolding(index, updatedHolding)
  revalidatePath('/finance')
}

async function removeHolding(formData: FormData): Promise<void> {
  'use server'
  
  const index = parseInt(formData.get('index')?.toString() || '-1')
  
  if (index < 0) {
    throw new Error('Invalid index')
  }
  
  await deleteHolding(index)
  revalidatePath('/finance')
}

export const metadata: Metadata = {
  title: 'Portfolio Finance Tracker',
  description: 'Track portfolio value over time based on stock holdings and historical prices',
  openGraph: {
    title: 'Portfolio Finance Tracker | Max Stoiber (@mxstbr)',
    description: 'Track portfolio value over time based on stock holdings and historical prices',
    url: `${prodUrl}/finance`,
    siteName: 'Max Stoiber (@mxstbr)',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og?title=Portfolio%20Finance%20Tracker',
        alt: 'Max Stoiber (@mxstbr)',
        ...size,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio Finance Tracker | Max Stoiber (@mxstbr)',
    description: 'Track portfolio value over time based on stock holdings and historical prices',
    site: '@mxstbr',
    creator: '@mxstbr',
    images: ['/og?title=Portfolio%20Finance%20Tracker'],
  },
}

export default async function FinancePage() {
  if (!(await isMax())) return notFound();
  
  // Generate portfolio history from the first holding date to today
  const { getHoldingsData } = await import('./holdings-data')
  const holdingsData = await getHoldingsData()
  
  // Find the earliest holding date
  const startDate = holdingsData
    .map(h => h.date)
    .sort()[0] || '2019-01-01'
  
  const endDate = new Date().toISOString().split('T')[0]
  
  // Fetch all data efficiently in one batch call
  const { portfolioHistory, returnHistory, currentStats, returns, gainsLoss } = await getCompletePortfolioData(startDate, endDate)
  
  // Get the latest time-weighted return for display
  const latestTimeWeightedReturn = returnHistory.length > 0 
    ? returnHistory[returnHistory.length - 1].timeWeightedReturn || 0 
    : 0
  
  return (
    <MoneyVisibilityProvider>
      <div className="space-y-8">
        <Prose>
          <h1>Stock Portfolio Tracker</h1>
        </Prose>

        {/* Current Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Total Portfolio Value
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              <BlurredValue>${formatDollar(currentStats.totalValue)}</BlurredValue>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Total Gain/Loss
            </h3>
            <p className={`text-2xl font-bold ${gainsLoss.totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <BlurredValue>
                {gainsLoss.totalGainLoss >= 0 ? '+' : ''}${formatDollar(gainsLoss.totalGainLoss)}
              </BlurredValue>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Total Return
            </h3>
            <p className={`text-2xl font-bold ${latestTimeWeightedReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {latestTimeWeightedReturn >= 0 ? '+' : ''}{latestTimeWeightedReturn.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Time-weighted</p>
          </div>
        </div>

        {/* Portfolio Value Chart */}
        <PortfolioChart portfolioHistory={portfolioHistory} />

        {/* Portfolio Return Chart */}
        <ReturnChart returnHistory={returnHistory} />

        {/* Holdings with Gains/Losses */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Current Holdings & Gains/Losses
          </h2>
          <div className="space-y-4">
            {gainsLoss.holdingsGainsLoss.map((holding) => (
              <div key={holding.ticker} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {holding.ticker}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {holding.ticker}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {holding.totalShares.toFixed(3)} shares @ <BlurredValue>${formatDollar(holding.currentPrice)}</BlurredValue>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Cost basis: <BlurredValue>${formatDollar(holding.totalCostBasis)}</BlurredValue>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    <BlurredValue>${formatDollar(holding.currentValue)}</BlurredValue>
                  </p>
                  <p className={`text-sm font-medium ${holding.totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <BlurredValue>
                      {holding.totalGainLoss >= 0 ? '+' : ''}${formatDollar(holding.totalGainLoss)}
                    </BlurredValue>
                  </p>
                  <p className={`text-xs ${holding.totalGainLossPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {holding.totalGainLossPercent >= 0 ? '+' : ''}{holding.totalGainLossPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Holdings Performance Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gainsLoss.holdingsGainsLoss.map((holding) => (
              <div key={holding.ticker} className="text-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  {holding.ticker}
                </p>
                <p className={`text-xl font-bold ${holding.totalGainLossPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {holding.totalGainLossPercent >= 0 ? '+' : ''}{holding.totalGainLossPercent.toFixed(1)}%
                </p>
                <p className={`text-sm ${holding.totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <BlurredValue>
                    {holding.totalGainLoss >= 0 ? '+' : ''}${formatDollar(holding.totalGainLoss)}
                  </BlurredValue>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Portfolio Total
              </span>
              <div className="text-right">
                <p className={`text-xl font-bold ${latestTimeWeightedReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {latestTimeWeightedReturn >= 0 ? '+' : ''}{latestTimeWeightedReturn.toFixed(1)}% (Time-weighted)
                </p>
                <p className={`text-sm ${gainsLoss.totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <BlurredValue>
                    {gainsLoss.totalGainLoss >= 0 ? '+' : ''}${formatDollar(gainsLoss.totalGainLoss)}
                  </BlurredValue>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Purchase History */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            Purchase History & Cost Basis
          </h2>
          <div className="space-y-6">
            {gainsLoss.holdingsGainsLoss.map((holding) => (
              <div key={holding.ticker} className="border-b border-slate-200 dark:border-slate-700 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  {holding.ticker}
                </h3>
                <div className="space-y-2">
                  {holding.purchases.map((purchase, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex space-x-4">
                        <span className="text-slate-600 dark:text-slate-400">
                          {purchase.date}
                        </span>
                        <span className="text-slate-900 dark:text-slate-100">
                          {purchase.shares.toFixed(3)} shares
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          @ <BlurredValue>${formatDollar(purchase.purchasePrice)}</BlurredValue>
                        </span>
                      </div>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        <BlurredValue>${formatDollar(purchase.costBasis)}</BlurredValue>
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm font-semibold pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-900 dark:text-slate-100">
                      Total: {holding.totalShares.toFixed(3)} shares
                    </span>
                    <span className="text-slate-900 dark:text-slate-100">
                      Cost Basis: <BlurredValue>${formatDollar(holding.totalCostBasis)}</BlurredValue>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Holdings Management */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Manage Holdings
            </h2>
            <AddHoldingForm createAction={createHolding} />
          </div>

          <div className="space-y-4">
            {holdingsData.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                No holdings found. Add your first holding to get started.
              </p>
            ) : (
              holdingsData.map((holding, index) => (
                <HoldingsListItem
                  key={`${holding.ticker}-${holding.date}-${index}`}
                  holding={holding}
                  index={index}
                  editAction={editHolding}
                  deleteAction={removeHolding}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </MoneyVisibilityProvider>
  )
}
