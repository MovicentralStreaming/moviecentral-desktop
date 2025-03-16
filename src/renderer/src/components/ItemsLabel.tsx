import { ReactNode } from 'react'

export function ItemsLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-2xl font-medium mb-6">{children}</h2>
}
