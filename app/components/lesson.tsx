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
    <div className="text-gray-500 bg-gray-50 dark:bg-gray-900 dark:text-gray-300 rounded-xl p-8 border border-gray-100 dark:border-gray-800 my-4">
      <div>
        <strong>{props.title}</strong>: <span>{props.body}</span>
      </div>
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden flex items-center">
          <div className="ml-[-30px] bg-white">
            {/* TODO:              */}
            {/* <Award className="w-20 h-20" /> */}
          </div>
        </div>
      </div>
    </div>
  )
}
