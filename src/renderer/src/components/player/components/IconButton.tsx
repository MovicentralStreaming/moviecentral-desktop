import { ReactNode } from 'react'

export function IconButton({
  children,
  onClick,
  onMouseEnter,
  onMouseLeave
}: {
  children: ReactNode
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  return (
    <button
      onMouseOver={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className="cursor-pointer will-change-transform transition-transform hover:scale-125"
    >
      {children}
    </button>
  )
}
