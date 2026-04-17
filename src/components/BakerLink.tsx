"use client"
import { useRouter } from 'next/navigation'

export function BakerLink({ bakerId, children }: { bakerId: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <span
      onClick={(e) => {
        e.stopPropagation()
        router.push(`/bakers/${bakerId}`)
      }}
      className="text-xs text-amber-600 hover:underline mt-0.5 block cursor-pointer"
    >
      {children}
    </span>
  )
}
