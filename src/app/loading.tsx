import { SkeletonProductGrid } from '@/components/Skeleton'

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-amber-50">
      <div className="bg-white border-b border-amber-100 px-4 py-3 h-[53px]" />
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-4 text-center space-y-2">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-lg mx-auto" />
        <div className="h-4 w-48 bg-gray-200 animate-pulse rounded-lg mx-auto" />
      </div>
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="h-10 w-full bg-gray-200 animate-pulse rounded-full mb-3" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 animate-pulse rounded-full" />
          ))}
        </div>
      </div>
      <main className="max-w-5xl mx-auto px-4 pb-16">
        <SkeletonProductGrid count={8} />
      </main>
    </div>
  )
}
