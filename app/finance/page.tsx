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
  const startDate = '2023-01-01'
  const endDate = new Date().toISOString().split('T')[0]
  
  // Fetch all data efficiently in one batch call
  const { portfolioHistory, currentStats, returns } = await getCompletePortfolioData(startDate, endDate)
  
  return (
    <div className="space-y-8">
      <Prose>
        <h1>Portfolio Finance Tracker</h1>
        <p>
          Track your stock portfolio value over time based on historical holdings and stock prices. 
          This demo uses mock data to show how portfolio value changes based on stock purchases, 
          sales, and market movements.
        </p>
      </Prose>
      
      {/* Current Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            1 Year Return
          </h3>
          <p className={`text-3xl font-bold ${returns.oneYear >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {returns.oneYear >= 0 ? '+' : ''}{returns.oneYear.toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Total Return
          </h3>
          <p className={`text-3xl font-bold ${returns.inception >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {returns.inception >= 0 ? '+' : ''}{returns.inception.toFixed(1)}%
          </p>
        </div>
      </div>
      
      {/* Portfolio Value Chart */}
      <PortfolioChart portfolioHistory={portfolioHistory} />
      
      {/* Top Holdings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
          Current Holdings
        </h2>
        <div className="space-y-4">
          {currentStats.topHoldings.map((holding) => (
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
                    {currentStats.totalShares[holding.ticker]} shares
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  ${holding.value.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {holding.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Performance Summary */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
          Performance Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">1 Month</p>
            <p className={`font-semibold ${returns.oneMonth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {returns.oneMonth >= 0 ? '+' : ''}{returns.oneMonth.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">3 Months</p>
            <p className={`font-semibold ${returns.threeMonths >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {returns.threeMonths >= 0 ? '+' : ''}{returns.threeMonths.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">6 Months</p>
            <p className={`font-semibold ${returns.sixMonths >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {returns.sixMonths >= 0 ? '+' : ''}{returns.sixMonths.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">1 Year</p>
            <p className={`font-semibold ${returns.oneYear >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {returns.oneYear >= 0 ? '+' : ''}{returns.oneYear.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total</p>
            <p className={`font-semibold ${returns.inception >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {returns.inception >= 0 ? '+' : ''}{returns.inception.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
