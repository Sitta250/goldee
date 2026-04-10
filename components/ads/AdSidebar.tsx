// Ad slot: Desktop Sidebar / Wide Skyscraper
// Location: right rail on desktop layouts (lg+). Hidden on mobile.
// Typical size: 160×600 (wide skyscraper) or 300×600 (half-page).
// To enable: set NEXT_PUBLIC_ADS_ENABLED=true and replace inner content with your ad network's script tag.
// Usage: wrap page content in a two-column grid and place <AdSidebar /> in the right column.

export function AdSidebar() {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== 'true') return null

  return (
    <aside
      aria-hidden="true"
      className="hidden lg:flex flex-col items-center"
    >
      <div className="sticky top-24">
        <div className="flex items-center justify-center w-[160px] h-[600px] bg-gray-100 rounded-card border border-gray-200 text-xs text-gray-400 font-sans tracking-wide text-center px-2">
          [ AD SLOT Sidebar 160×600 ]
        </div>
      </div>
    </aside>
  )
}
