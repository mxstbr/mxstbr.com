export function Section({
  title,
  children,
  className,
}: {
  title?: string | React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-6 flex-1 ${className}`}>
      {title && <h2 className="font-bold text-lg">{title}</h2>}
      {children}
    </div>
  )
}
