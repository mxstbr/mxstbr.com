export default function Prose(props) {
  return (
    <div
      {...props}
      className={`prose prose-gray dark:prose-invert ${props.className}`}
    />
  )
}
