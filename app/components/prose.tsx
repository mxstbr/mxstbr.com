export default function Prose(props) {
  return (
    <div
      {...props}
      // -slate has to match tailwind.config.js
      className={`prose prose-slate dark:prose-invert ${props.className}`}
    />
  )
}
