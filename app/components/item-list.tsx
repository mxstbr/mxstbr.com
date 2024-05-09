export function ItemList(props: { children: React.ReactNode }) {
  return <ul className="space-y-4 pl-0">{props.children}</ul>
}

export function ItemListItem(props) {
  return (
    <li className="flex flex-1 items-center space-x-4 pl-0">
      <div className="text-neutral-900 dark:text-neutral-100 xs:shrink-0">
        {props.left}
      </div>
      <span
        className="w-full border-t border-gray-300 border-dashed dark:border-gray-500 min-w-4"
        style={{ flexShrink: 999999 }}
      ></span>
      <div className="text-neutral-600 text-right dark:text-neutral-400 tabular-nums xs:shrink-0">
        {props.right}
      </div>
    </li>
  )
}
