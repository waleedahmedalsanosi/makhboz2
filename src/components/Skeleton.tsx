export function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 animate-pulse rounded-lg ${className}`} />
}

export function SkeletonProductCard() {
  return (
    <div className="bg-white rounded-xl border border-amber-100 overflow-hidden">
      <SkeletonBox className="aspect-square rounded-none" />
      <div className="p-3 space-y-2">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-1/2" />
        <SkeletonBox className="h-4 w-1/3" />
      </div>
    </div>
  )
}

export function SkeletonProductGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonOrderCard() {
  return (
    <div className="bg-white rounded-xl border border-amber-100 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-4 w-2/3" />
          <SkeletonBox className="h-3 w-1/2" />
          <SkeletonBox className="h-3 w-1/3" />
        </div>
        <div className="space-y-2 shrink-0">
          <SkeletonBox className="h-5 w-20" />
          <SkeletonBox className="h-5 w-16" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonOrderList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonOrderCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBox className="h-4" />
        </td>
      ))}
    </tr>
  )
}
