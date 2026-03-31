// Ad slot: In-content Rectangle
// Location: between the chart and the daily summary card on the homepage,
//           and between chart and table on the history page.
// Typical size: 300×250 (medium rectangle). Centers on mobile.
// TODO: Replace inner content with your ad network's script tag.

export function AdRectangle() {
  return (
    <div aria-hidden="true" className="flex justify-center my-6">
      <div className="flex items-center justify-center w-[300px] h-[250px] bg-gray-100 rounded-card border border-gray-200 text-xs text-gray-400 font-sans tracking-wide">
        [ AD SLOT — Rectangle 300×250 ]
      </div>
    </div>
  )
}
