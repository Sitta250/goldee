import { Container } from '@/components/layout/Container'

// Skeleton that approximates the homepage layout while data loads
export default function Loading() {
  return (
    <div className="py-6 sm:py-8">
      <Container>
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0 space-y-8 animate-pulse">

            {/* Hero skeleton */}
            <div className="rounded-card bg-white border border-gray-100 shadow-card p-5 sm:p-6 space-y-4">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-4 space-y-2">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                    <div className="h-8 w-24 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Chart skeleton */}
            <div className="rounded-card bg-white border border-gray-100 shadow-card p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-7 w-10 bg-gray-100 rounded-md" />
                  ))}
                </div>
              </div>
              <div className="h-[180px] sm:h-[220px] bg-gray-50 rounded-lg" />
            </div>

            {/* Ad placeholder */}
            <div className="h-16 bg-gray-100 rounded-card" />

            {/* Articles heading + grid */}
            <div className="space-y-5">
              <div className="h-5 w-32 bg-gray-200 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-card bg-white border border-gray-100 shadow-card overflow-hidden">
                    <div className="aspect-[16/9] bg-gray-100" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                      <div className="h-4 w-full bg-gray-100 rounded" />
                      <div className="h-4 w-3/4 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar placeholder */}
          <div className="hidden lg:block w-[300px] shrink-0 h-[250px] bg-gray-100 rounded-card" />
        </div>
      </Container>
    </div>
  )
}
