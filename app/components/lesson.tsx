import React from 'react'
// import { Award } from "react-feather";

type Props = {
  title: string
  body: string
  first?: boolean
  last?: boolean
}

export default function Lesson(props: Props) {
  return (
    <div className="text-slate-500 bg-slate-50 dark:bg-slate-900 dark:text-slate-300 rounded-xl p-8 border border-slate-100 dark:border-slate-800 my-4">
      <div>
        <strong>{props.title}</strong>: <span>{props.body}</span>
      </div>
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden flex items-center">
          <div className="ml-[-30px] bg-white"></div>
        </div>
      </div>
    </div>
  )
}
