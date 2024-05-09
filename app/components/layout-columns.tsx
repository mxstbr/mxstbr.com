type Props = {
  left?: React.ReactNode
  middle?: React.ReactNode
  right?: React.ReactNode
} & React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>

export function Columns({ left, middle, right, ...props }: Props) {
  return (
    <div
      {...props}
      className={`${/* ~16" screen styling */ ''}
        2xl:grid 2xl:grid-cols-3 2xl:grid-flow-col
        ${/* Mobile & small screen styling */ ''}
        grid grid-cols-1 justify-items-center
        ${props.className || ''}
      `.replace(/\s+/g, ' ')}
    >
      <Column>{left}</Column>
      <Column>{middle}</Column>
      <Column>{right}</Column>
    </div>
  )
}

export function CenterPage({ children }) {
  return <Columns middle={children} />
}

function Column(props) {
  return <div {...props} className={`w-full max-w-prose 2xl:max-w-full`} />
}
