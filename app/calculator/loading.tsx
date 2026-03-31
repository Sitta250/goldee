import { Container } from '@/components/layout/Container'

export default function Loading() {
  return (
    <div className="py-6 sm:py-8">
      <Container width="narrow">
        <div className="space-y-8 animate-pulse">

          {/* Heading */}
          <div className="space-y-2">
            <div className="h-7 w-44 bg-gray-200 rounded" />
            <div className="h-4 w-72 bg-gray-100 rounded" />
            <div className="h-3.5 w-40 bg-gray-100 rounded" />
          </div>

          {/* Calculator card */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-card p-6 sm:p-8 space-y-6">
            {/* Purity buttons */}
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
            {/* Weight + unit */}
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>
            {/* Buy/sell toggle */}
            <div className="h-10 bg-gray-100 rounded-xl" />
            {/* Result */}
            <div className="h-20 bg-gray-50 rounded-xl border border-gray-100" />
          </div>

        </div>
      </Container>
    </div>
  )
}
