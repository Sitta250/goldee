// Ad slot: Top Banner
// Location: below the site header, across the full width on all pages.
// Typical size: 728×90 (leaderboard) on desktop, 320×50 (mobile banner) on mobile.
// To enable: set NEXT_PUBLIC_ADS_ENABLED=true and replace inner content with your ad network's script tag.

export function AdBanner() {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== 'true') return null

  return (
    <div
      aria-hidden="true"
      className="w-full bg-gray-100 border-b border-gray-200"
    >
      <div className="mx-auto max-w-7xl px-4">
        {/* Desktop: 728×90 */}
        <div className="hidden sm:flex items-center justify-center h-[90px]">
          <div className="flex items-center justify-center w-[728px] max-w-full h-[90px] bg-gray-200 rounded text-xs text-gray-400 font-sans tracking-wide">
            [ AD SLOT — Top Leaderboard 728×90 ]
          </div>
        </div>
        {/* Mobile: 320×50 */}
        <div className="flex sm:hidden items-center justify-center h-[50px]">
          <div className="flex items-center justify-center w-full h-[50px] bg-gray-200 rounded text-xs text-gray-400 font-sans tracking-wide">
            [ AD — Mobile Banner 320×50 ]
          </div>
        </div>
      </div>
    </div>
  )
}
