'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { type PortfolioReturn } from './portfolio-calculator'
import { BlurredValue } from './money-visibility'

// Utility function to format dollar values rounded to nearest dollar
function formatDollar(value: number): string {
  return Math.round(value).toLocaleString()
}

interface ReturnChartProps {
  returnHistory: PortfolioReturn[]
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          {new Date(label).toLocaleDateString()}
        </p>
        <p className={`text-sm font-medium ${data.returnPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          Time-Weighted: {data.returnPercent >= 0 ? '+' : ''}{data.returnPercent.toFixed(2)}%
        </p>
        <p className={`text-sm ${data.moneyWeightedReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          Money-Weighted: {data.moneyWeightedReturn >= 0 ? '+' : ''}{data.moneyWeightedReturn.toFixed(2)}%
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          S&P 500: +{data.sp500Return.toFixed(2)}%
        </p>
        <div className="border-t border-slate-200 dark:border-slate-600 mt-2 pt-2">
          <p className={`text-sm ${data.returnDollars >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            Total Gain/Loss:{' '}
            <BlurredValue>
              {data.returnDollars >= 0 ? '+' : ''}${formatDollar(data.returnDollars)}
            </BlurredValue>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Value: <BlurredValue>${formatDollar(data.totalValue)}</BlurredValue>
          </p>
        </div>
      </div>
    )
  }
  return null
}

export default function ReturnChart({ returnHistory }: ReturnChartProps) {
  // S&P 500 historical average annual return (approximately 10%)
  const SP500_ANNUAL_RETURN = 0.10
  
  // Calculate S&P 500 benchmark returns
  const calculateSP500Returns = () => {
    if (returnHistory.length === 0) return []
    
    const startDate = new Date(returnHistory[0].date)
    
    return returnHistory.map(point => {
      const currentDate = new Date(point.date)
      const yearsElapsed = (currentDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      
      // Calculate compound annual growth: (1 + r)^t - 1
      const sp500Return = yearsElapsed > 0 ? ((1 + SP500_ANNUAL_RETURN) ** yearsElapsed - 1) * 100 : 0
      
      return sp500Return
    })
  }
  
  const sp500Returns = calculateSP500Returns()
  
  // Format data for the chart
  const chartData = returnHistory.map((point, index) => ({
    date: point.date,
    returnPercent: point.timeWeightedReturn || 0, // Use time-weighted return
    moneyWeightedReturn: point.returnPercent, // Keep money-weighted for tooltip
    returnDollars: point.returnDollars,
    totalValue: point.totalValue,
    totalCostBasis: point.totalCostBasis,
    sp500Return: sp500Returns[index] || 0
  }))

  // Find min and max return percentages for better Y-axis scaling (include all three lines)
  const timeWeightedReturns = chartData.map(d => d.returnPercent)
  const moneyWeightedReturns = chartData.map(d => d.moneyWeightedReturn)
  const sp500Percentages = chartData.map(d => d.sp500Return)
  const allReturns = [...timeWeightedReturns, ...moneyWeightedReturns, ...sp500Percentages]
  const minReturn = Math.min(...allReturns)
  const maxReturn = Math.max(...allReturns)
  
  // Add some padding to the Y-axis range
  const yAxisPadding = Math.max(Math.abs(maxReturn - minReturn) * 0.1, 5)
  const yAxisMin = minReturn - yAxisPadding
  const yAxisMax = maxReturn + yAxisPadding

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
        Portfolio Return vs S&P 500 Benchmark
      </h2>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              className="text-slate-600 dark:text-slate-400"
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              className="text-slate-600 dark:text-slate-400"
              domain={[yAxisMin, yAxisMax]}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Time-weighted return line (primary) */}
            <Line 
              type="monotone" 
              dataKey="returnPercent" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: '#10b981',
                stroke: '#ffffff',
                strokeWidth: 2
              }}
              name="Time-Weighted"
            />
            {/* Money-weighted return line (muted) */}
            <Line 
              type="monotone" 
              dataKey="moneyWeightedReturn" 
              stroke="#72CAAD" 
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ 
                r: 3, 
                fill: '#6b7280',
                stroke: '#ffffff',
                strokeWidth: 1
              }}
              name="Money-Weighted"
            />
            {/* S&P 500 benchmark line (most muted) */}
            <Line 
              type="monotone" 
              dataKey="sp500Return" 
              stroke="#9ca3af" 
              strokeWidth={1}
              strokeDasharray="8 4"
              dot={false}
              activeDot={{ 
                r: 2, 
                fill: '#9ca3af',
                stroke: '#ffffff',
                strokeWidth: 1
              }}
              name="S&P 500"
            />
            {/* Add a reference line at 0% */}
            <Line 
              type="monotone" 
              dataKey={() => 0} 
              stroke="#6b7280" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-green-500"></div>
            <span>Time-Weighted Return</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-gray-600 border-dashed border-t border-gray-600"></div>
            <span>Money-Weighted Return</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-gray-400 border-dashed border-t border-gray-400"></div>
            <span>S&P 500 (~10% annually)</span>
          </div>
        </div>
        <div className="space-y-2">
          <p>
            This chart compares <strong>time-weighted</strong> (green) vs <strong>money-weighted</strong> (gray dashed) returns. 
            Time-weighted ignores cash flow timing and shows pure stock-picking performance.
          </p>
          <p className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded-sm border-l-2 border-blue-400">
            <strong>Key Difference:</strong> Time-weighted return stays smooth through new purchases, while money-weighted 
            return drops when you invest more money (visible as the gray dashed line dipping when you buy more shares).
          </p>
        </div>
      </div>
    </div>
  )
}
