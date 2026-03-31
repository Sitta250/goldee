interface ContentSectionProps {
  id?:       string
  icon?:     string
  title:     string
  children:  React.ReactNode
  className?: string
}

/**
 * Reusable section block for long-form content pages (About, Methodology, etc.)
 * Consistent heading style, optional icon, and readable prose area.
 */
export function ContentSection({
  id,
  icon,
  title,
  children,
  className = '',
}: ContentSectionProps) {
  return (
    <section id={id} className={`space-y-4 ${className}`}>
      <h2 className="flex items-center gap-2.5 text-lg font-semibold text-gray-900">
        {icon && (
          <span className="text-xl leading-none select-none" aria-hidden="true">
            {icon}
          </span>
        )}
        {title}
      </h2>
      <div className="text-sm text-gray-700 leading-[1.85] space-y-3">
        {children}
      </div>
    </section>
  )
}
