import * as React from 'react'
import { cn } from '@/lib/utils'

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-lg border border-border bg-white p-4 shadow-sm active:scale-[0.98] transition-transform sm:active:scale-100', className)} {...props} />
)
