import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn('shimmer rounded-lg', className)} />
)

export const TableSkeleton = ({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) => (
  <div className='space-y-3'>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className='flex items-center gap-3'>
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className={cn('h-8', j === 0 ? 'w-8' : j === 1 ? 'w-40' : 'w-24')} />
        ))}
      </div>
    ))}
  </div>
)

export const CardSkeleton = () => (
  <div className='rounded-xl border border-border bg-white p-4'>
    <Skeleton className='mb-3 h-4 w-32' />
    <Skeleton className='h-8 w-20' />
    <Skeleton className='mt-2 h-3 w-48' />
  </div>
)

export const StatCardSkeleton = () => (
  <div className='relative overflow-hidden rounded-xl border border-border bg-white p-4'>
    <div className='absolute left-0 right-0 top-0 h-1 shimmer' />
    <div className='flex items-start justify-between pt-1'>
      <div className='space-y-2'>
        <Skeleton className='h-3 w-24' />
        <Skeleton className='h-8 w-16' />
      </div>
      <Skeleton className='h-12 w-12 rounded-xl' />
    </div>
  </div>
)

export const ProfileSkeleton = () => (
  <div className='space-y-4'>
    <Skeleton className='h-24 w-full rounded-2xl' />
    <div className='space-y-3'>
      <Skeleton className='h-10 w-full rounded-xl' />
      <Skeleton className='h-10 w-full rounded-xl' />
      <Skeleton className='h-10 w-3/4 rounded-xl' />
    </div>
  </div>
)
