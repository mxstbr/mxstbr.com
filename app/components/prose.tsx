export default function Prose(props) {
  return (
    <div
      {...props}
      className={`prose md:prose-lg lg:prose-xl ${props.className}`}
    />
  )
}
