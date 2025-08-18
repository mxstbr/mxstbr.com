import { Metadata } from 'next'
import { getCompletePortfolioData } from './portfolio-calculator'
import PortfolioChart from './portfolio-chart'
import Prose from 'app/components/prose'
import { size } from 'app/og/utils'
import { prodUrl } from 'app/sitemap'

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
  // Generate portfolio history from the first holding date to today
  const { getHoldingsData } = await import('./holdings-data')
  const holdingsData = await getHoldingsData()
  
  // Find the earliest holding date
  const startDate = holdingsData
    .map(h => h.date)
    .sort()[0] || '2019-01-01'
  
  const endDate = new Date().toISOString().split('T')[0]
  
  // Fetch all data efficiently in one batch call
  const { portfolioHistory, currentStats, returns, gainsLoss } = await getCompletePortfolioData(startDate, endDate)
  
  return (
    <div className="space-y-8">
      <Prose>
        <h1>Portfolio Finance Tracker</h1>
        <p>
          Track your stock portfolio value over time based on historical holdings and real stock prices. 
          This tracker uses live data from Tiingo API to show how portfolio value changes based on stock purchases, 
          sales, and market movements.
        </p>
      </Prose>
      
      {/* Current Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Total Portfolio Value
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            ${currentStats.totalValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Total Gain/Loss
          </h3>
          <p className={`text-2xl font-bold ${gainsLoss.totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {gainsLoss.totalGainLoss >= 0 ? '+' : ''}${gainsLoss.totalGainLoss.toLocaleString()}
          </p>
          <p className={`text-sm ${gainsLoss.totalGainLossPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {gainsLoss.totalGainLossPercent >= 0 ? '+' : ''}{gainsLoss.totalGainLossPercent.toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Total Cost Basis
          </h3>
          <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
            ${gainsLoss.totalCostBasis.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Total Return
          </h3>
          <p className={`text-2xl font-bold ${gainsLoss.totalGainLossPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {gainsLoss.totalGainLossPercent >= 0 ? '+' : ''}{gainsLoss.totalGainLossPercent.toFixed(1)}%
          </p>
        </div>
      </div>
      
      {/* Portfolio Value Chart */}
      <PortfolioChart portfolioHistory={portfolioHistory} />
      
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
                    {holding.totalShares.toFixed(3)} shares @ ${holding.currentPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Cost basis: ${holding.totalCostBasis.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  ${holding.currentValue.toLocaleString()}
                </p>
                <p className={`text-sm font-medium ${holding.totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {holding.totalGainLoss >= 0 ? '+' : ''}${holding.totalGainLoss.toLocaleString()}
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
                {holding.totalGainLoss >= 0 ? '+' : ''}${holding.totalGainLoss.toLocaleString()}
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
              <p className={`text-xl font-bold ${gainsLoss.totalGainLossPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {gainsLoss.totalGainLossPercent >= 0 ? '+' : ''}{gainsLoss.totalGainLossPercent.toFixed(1)}%
              </p>
              <p className={`text-sm ${gainsLoss.totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {gainsLoss.totalGainLoss >= 0 ? '+' : ''}${gainsLoss.totalGainLoss.toLocaleString()}
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
                        @ ${purchase.purchasePrice.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      ${purchase.costBasis.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm font-semibold pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-900 dark:text-slate-100">
                    Total: {holding.totalShares.toFixed(3)} shares
                  </span>
                  <span className="text-slate-900 dark:text-slate-100">
                    Cost Basis: ${holding.totalCostBasis.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
