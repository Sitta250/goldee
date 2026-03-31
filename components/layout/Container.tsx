interface ContainerProps {
  children: React.ReactNode
  className?: string
  // Use 'narrow' for single-column reading content (articles, about)
  width?: 'default' | 'narrow' | 'wide'
}

const widthClass = {
  default: 'max-w-5xl',
  narrow:  'max-w-3xl',
  wide:    'max-w-7xl',
}

export function Container({
  children,
  className = '',
  width = 'default',
}: ContainerProps) {
  return (
    <div className={`mx-auto w-full ${widthClass[width]} px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}
