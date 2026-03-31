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

          {/* Category filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
            ))}
          </div>

          {/* Featured article skeleton */}
          <div className="rounded-card bg-white border border-gray-100 shadow-card overflow-hidden sm:flex">
            <div className="w-full aspect-[16/9] sm:aspect-auto sm:w-[45%] sm:shrink-0 bg-gray-100" />
            <div className="p-6 sm:p-8 flex-1 space-y-3">
              <div className="h-4 w-20 bg-gray-200 rounded-full" />
              <div className="space-y-2">
                <div className="h-6 w-full bg-gray-200 rounded" />
                <div className="h-6 w-3/4 bg-gray-200 rounded" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-5/6 bg-gray-100 rounded" />
                <div className="h-4 w-2/3 bg-gray-100 rounded" />
              </div>
            </div>
          </div>

          {/* Article grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-card bg-white border border-gray-100 shadow-card overflow-hidden">
                <div className="aspect-[16/9] bg-gray-100" />
                <div className="p-4 space-y-2.5">
                  <div className="flex gap-2">
                    <div className="h-5 w-14 bg-gray-200 rounded-full" />
                    <div className="h-5 w-20 bg-gray-100 rounded" />
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-4/5 bg-gray-200 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </Container>
    </div>
  )
}
