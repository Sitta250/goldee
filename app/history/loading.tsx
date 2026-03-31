import { Container } from '@/components/layout/Container'

export default function Loading() {
  return (
    <div className="py-6 sm:py-8">
      <Container>
        <div className="space-y-8 animate-pulse">

          {/* Heading */}
          <div className="space-y-1.5">
            <div className="h-7 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-64 bg-gray-100 rounded" />
          </div>

          {/* Chart card */}
          <div className="rounded-card bg-white border border-gray-100 shadow-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-7 w-12 bg-gray-100 rounded-md" />
                ))}
              </div>
            </div>
            {/* Metric toggle */}
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-20 bg-gray-100 rounded-md" />
              ))}
            </div>
            <div className="h-[200px] sm:h-[260px] bg-gray-50 rounded-lg" />
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-card bg-white border border-gray-100 shadow-card px-4 py-3 space-y-2">
                <div className="h-3 w-12 bg-gray-200 rounded" />
                <div className="h-5 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-card bg-white border border-gray-100 shadow-card h-64" />

        </div>
      </Container>
    </div>
  )
}
