export default function Prose(props) {
  return (
    <div
      {...props}
      className={`prose prose-slate dark:prose-invert ${props.className}`}
    />
  )
}
