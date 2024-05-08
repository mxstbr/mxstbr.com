export function Columns(props) {
  return (
    <div
      {...props}
      className={`space-y-16 2xl:space-y-0 2xl:space-x-16 2xl:w-screen relative 2xl:ml-[-50vw] 2xl:mr-[-50vw] 2xl:inset-x-2/4 2xl:flex 2xl:flex-row 2xl:justify-between 2xl:px-12 ${props.className}`}
    />
  )
}

export function Column(props) {
  return <div {...props} className={`flex-1`} />
}
