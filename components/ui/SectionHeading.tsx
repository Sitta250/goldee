interface SectionHeadingProps {
  title: string
  subtitle?: string
  action?: React.ReactNode  // e.g. a "ดูทั้งหมด" link
  className?: string
  id?: string
}

export function SectionHeading({
  title,
  subtitle,
  action,
  className = '',
  id,
}: SectionHeadingProps) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div>
        <h2 id={id} className="text-base font-semibold text-gray-700">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
