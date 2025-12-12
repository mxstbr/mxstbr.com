'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PortfolioValue } from './portfolio-calculator'
import { useMoneyVisibility, BlurredValue } from './money-visibility'

// Utility function to format dollar values rounded to nearest dollar
function formatDollar(value: number): string {
  return Math.round(value).toLocaleString()
}

interface PortfolioChartProps {
  portfolioHistory: PortfolioValue[]
}

export default function PortfolioChart({ portfolioHistory }: PortfolioChartProps) {
  const { unlocked, requestUnlock } = useMoneyVisibility()
  // Format data for the chart
  const chartData = portfolioHistory.map(item => ({
    date: item.date,
    value: Math.round(item.totalValue),
    formattedDate: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    })
  }))
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="text-slate-600 dark:text-slate-400">
            {new Date(label).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-slate-900 dark:text-slate-100 font-semibold">
            <BlurredValue>${formatDollar(payload[0].value)}</BlurredValue>
          </p>
        </div>
      )
    }
    return null
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
          <LineChart
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
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, className: "fill-green-500" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
