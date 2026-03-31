// Ad slot: Pre-footer Band
// Location: immediately above the site footer, full width.
// Typical size: 728×90 (leaderboard) or a full-width responsive unit.
// TODO: Replace inner content with your ad network's script tag.

export function AdFooter() {
  return (
    <div
      aria-hidden="true"
      className="w-full bg-gray-100 border-t border-gray-200 mt-12"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-center h-[90px]">
          <div className="flex items-center justify-center w-full max-w-[728px] h-[90px] bg-gray-200 rounded text-xs text-gray-400 font-sans tracking-wide">
            [ AD SLOT — Pre-footer Leaderboard 728×90 ]
          </div>
        </div>
      </div>
    </div>
  )
}
