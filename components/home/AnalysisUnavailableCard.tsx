/**
 * AnalysisUnavailableCard — placeholder shown when the AI analysis is
 * absent (never generated) or suppressed because it is too stale relative
 * to the current price snapshot (> 24 h gap — see validateAnalysisForSnapshot).
 *
 * Keeps the layout consistent so the page never shows an unexpected blank.
 */
export function AnalysisUnavailableCard() {
  return (
    <div className="rounded-card bg-white border border-gray-100 shadow-card px-5 py-6 text-center space-y-1.5">
      <p className="text-sm font-medium text-gray-500">
        ข้อมูลวิเคราะห์ยังไม่พร้อมใช้งาน
      </p>
      <p className="text-xs text-gray-400">
        บทวิเคราะห์จะพร้อมหลังการประมวลผลรอบถัดไป
      </p>
    </div>
  )
}
