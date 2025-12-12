'use client'

import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { PortfolioValue } from './portfolio-calculator'
import { useMoneyVisibility, BlurredValue } from './money-visibility'

// Utility function to format dollar values rounded to nearest dollar
function formatDollar(value: number): string {
  return Math.round(value).toLocaleString()
}

type ChartDataPoint = Record<string, number | string>

interface PortfolioChartProps {
  portfolioHistory: PortfolioValue[]
}

export default function PortfolioChart({ portfolioHistory }: PortfolioChartProps) {
  const { unlocked, requestUnlock } = useMoneyVisibility()
  const tickers = Array.from(
    new Set(portfolioHistory.flatMap(item => Object.keys(item.holdings)))
  ).sort()

  // Format data for the chart
  const chartData: ChartDataPoint[] = portfolioHistory.map(item => {
    const entry: ChartDataPoint = {
      date: item.date,
      totalValue: Math.round(item.totalValue),
      formattedDate: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })
    }

    tickers.forEach(ticker => {
      entry[ticker] = Math.round(item.holdings[ticker]?.value || 0)
    })

    return entry
  })

  const colorPalette = [
    '#10b981',
    '#6366f1',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#f97316'
  ]

  // Custom tooltip for the chart
  const CustomTooltip = (props: {
    active?: boolean
    payload?: Array<{
      color?: string
      dataKey?: string | number
      name?: string | number
      value?: number
      payload?: ChartDataPoint
    }>
    label?: string | number
  }) => {
    const { active, payload, label } = props
    if (!active || !payload?.length) return null

    const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)
    const formattedLabel = payload[0]?.payload?.date || label

    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
        <p className="text-slate-600 dark:text-slate-400">
          {new Date(formattedLabel || '').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <p className="text-slate-900 dark:text-slate-100 font-semibold">
          <BlurredValue>${formatDollar(total)}</BlurredValue>
        </p>
        <div className="mt-3 space-y-1">
          {payload.map(entry => (
            <div key={entry.dataKey} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="text-slate-900 dark:text-slate-100">
                <BlurredValue>${formatDollar(entry.value || 0)}</BlurredValue>
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Portfolio Value Over Time
      </h2>
      <div className="relative h-96">
        {!unlocked ? (
          <button
            type="button"
            onClick={requestUnlock}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 text-sm font-semibold text-slate-800 backdrop-blur-sm transition hover:bg-white/80 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900/80"
          >
            Dollar values hidden — click to enter parental pin
          </button>
        ) : null}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="formattedDate"
              className="text-slate-600 dark:text-slate-400"
              fontSize={12}
            />
            <YAxis
              className="text-slate-600 dark:text-slate-400"
              fontSize={12}
              tickFormatter={(value) => (unlocked ? `$${(value / 1000).toFixed(0)}k` : '•••')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                color: 'rgb(148 163 184)' // slate-400
              }}
            />
            {tickers.map((ticker, index) => {
              const color = colorPalette[index % colorPalette.length]

              return (
                <Area
                  key={ticker}
                  type="monotone"
                  dataKey={ticker}
                  name={ticker}
                  stackId="portfolio"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                  activeDot={{ r: 5, className: 'opacity-80' }}
                  isAnimationActive={false}
                />
              )
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
