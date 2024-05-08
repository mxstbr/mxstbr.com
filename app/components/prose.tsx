export default function Prose(props) {
  return (
    <div {...props} className={`prose dark:prose-invert ${props.className}`} />
  )
}
