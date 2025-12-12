import React from 'react'

type Props = {
  html: string
  children?: React.ReactNode
}

const Browser = ({ html, children }: Props) => (
  <div className="border border-slate-300 dark:border-slate-700 rounded-sm my-4">
    <div className="h-5 bg-slate-300 dark:bg-slate-700 rounded-t mb-4 relative">
      <div className="w-3 h-3 rounded-full bg-yellow-400 absolute top-1 left-2"></div>
      <div className="w-3 h-3 rounded-full bg-red-500 absolute top-1 left-7"></div>
      <div className="w-3 h-3 rounded-full bg-green-500 absolute top-1 left-12"></div>
    </div>
    <div className="w-full px-4">
      <div dangerouslySetInnerHTML={{ __html: html }}></div>
      {children}
    </div>
  </div>
)

export default Browser
