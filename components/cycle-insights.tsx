"use client"

interface CycleInsightsProps {
  cycles: any[]
}

export default function CycleInsights({ cycles }: CycleInsightsProps) {
  // Helper helper: Standard Deviation
  const getStandardDeviation = (array: number[]) => {
    if (array.length === 0) return 0
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
  }

  const calculateCycleStats = () => {
    if (cycles.length < 2) return null

    const cycleLengths = []
    for (let i = 1; i < cycles.length; i++) {
      const prevStart = new Date(cycles[i - 1].startDate)
      const currStart = new Date(cycles[i].startDate)
      const diff = Math.floor((currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24))
      cycleLengths.push(diff)
    }

    const avgCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    const minCycleLength = Math.min(...cycleLengths)
    const maxCycleLength = Math.max(...cycleLengths)
    const stdDev = getStandardDeviation(cycleLengths)
    const isIrregular = stdDev > 4 // Threshold for irregularity

    // AI Confidence Score (Simple heuristic: Lower variance = higher confidence)
    let confidence = 100 - (stdDev * 5)
    confidence = Math.max(10, Math.min(95, confidence)) // Clamp between 10% and 95%

    return { avgCycleLength, minCycleLength, maxCycleLength, stdDev, isIrregular, confidence }
  }

  const getNextPeriodPrediction = () => {
    if (cycles.length === 0) return null

    const lastCycle = cycles[0] // Sorted desc in PeriodTracker, so index 0 is latest? Wait, let's verify sort. 
    // In PeriodTracker: .sort((a, b) => new Date(b.startDate) - new Date(a.startDate)) -> Descending (newest first).
    // Cycles passing in prop usually come from there. If they are raw unsorted, we should sort.
    // Let's assume they are sorted by StartDate DESCENDING as per Firestore query.
    // If so, cycles[0] is the NEWEST.
    // BUT the loop above `for (let i = 1; i < cycles.length; i++)` assumes order?
    // Actually, `cycles` from `PeriodTracker` useEffect uses `orderBy("startDate", "desc")`. 
    // So cycles[0] is LATEST. cycles[1] is PREVIOUS.
    // My previous loop logic `cycles[i] - cycles[i-1]` would mean `older - newer` => negative.
    // I need to fix the loop order handling or sort local.

    // Let's safe sort local to be sure.
    const sortedCycles = [...cycles].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    // Now sortedCycles[last] is newest.

    // Re-calc with sorted
    const cycleLengths = []
    for (let i = 1; i < sortedCycles.length; i++) {
      const prevStart = new Date(sortedCycles[i - 1].startDate)
      const currStart = new Date(sortedCycles[i].startDate)
      const diff = Math.floor((currStart.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24))
      cycleLengths.push(diff)
    }

    // Stats logic again with sorted
    if (cycleLengths.length === 0) return null
    const avgLen = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    const stdDev = getStandardDeviation(cycleLengths)

    // Prediction
    const lastStart = new Date(sortedCycles[sortedCycles.length - 1].startDate)
    const nextDate = new Date(lastStart.getTime() + avgLen * 24 * 60 * 60 * 1000)
    const today = new Date()
    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Range (AI Prediction)
    const margin = Math.ceil(stdDev)
    const startRange = new Date(nextDate.getTime() - margin * 24 * 60 * 60 * 1000)
    const endRange = new Date(nextDate.getTime() + margin * 24 * 60 * 60 * 1000)

    return { nextPeriod: nextDate, daysUntil, isIrregular: stdDev > 4, startRange, endRange, margin }
  }

  const getCyclePhase = () => {
    if (cycles.length === 0) return null

    const lastCycle = cycles[cycles.length - 1]
    const lastStart = new Date(lastCycle.startDate)
    const today = new Date()
    const daysSinceStart = Math.floor((today.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceStart < 0) return null

    // Simplified cycle phases (28-day cycle)
    if (daysSinceStart <= 5) return { phase: "Menstruation", emoji: "🔴", color: "bg-accent-red" }
    if (daysSinceStart <= 13) return { phase: "Follicular", emoji: "🟡", color: "bg-yellow-500" }
    if (daysSinceStart <= 15) return { phase: "Ovulation", emoji: "🟠", color: "bg-orange-500" }
    return { phase: "Luteal", emoji: "🟣", color: "bg-accent-purple" }
  }

  const stats = calculateCycleStats()
  const prediction = getNextPeriodPrediction()
  const phase = getCyclePhase()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Current Phase */}
      {phase && (
        <div className={`${phase.color} text-white rounded-lg p-6 shadow-sm`}>
          <div className="text-4xl mb-2">{phase.emoji}</div>
          <h3 className="font-semibold mb-1">Current Phase</h3>
          <p className="text-sm opacity-90">{phase.phase}</p>
        </div>
      )}

      {/* Next Period (AI Enhanced) */}
      {prediction && (
        <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="text-4xl">📅</div>
            {stats && (
              <div className={`px-2 py-1 rounded-full text-xs font-bold ${stats.confidence > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {Math.round(stats.confidence)}% Confidence
              </div>
            )}
          </div>
          <h3 className="font-semibold text-foreground mb-1">Predicted Start</h3>

          {prediction.isIrregular ? (
            <div>
              <p className="text-lg font-bold text-primary">
                {prediction.startRange.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {prediction.endRange.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Due to irregularity (+/- {prediction.margin} days)
              </p>
            </div>
          ) : (
            <p className="text-lg font-bold text-primary">
              {prediction.nextPeriod.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          )}

          <p className="text-sm text-muted-foreground mt-2">
            {prediction.daysUntil > 0 ? `In approx ${prediction.daysUntil} days` : 'Expected soon'}
          </p>
        </div>
      )}

      {/* Cycle Statistics */}
      {stats && (
        <div className="bg-primary-light/10 border-2 border-primary-light rounded-lg p-6">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="font-semibold text-foreground mb-3">Cycle Statistics</h3>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Average: <span className="font-semibold text-foreground">{stats.avgCycleLength} days</span>
            </p>
            <p className="text-muted-foreground">
              Range:{" "}
              <span className="font-semibold text-foreground">
                {stats.minCycleLength}-{stats.maxCycleLength} days
                {stats.minCycleLength}-{stats.maxCycleLength} days
              </span>
            </p>
            <p className="text-muted-foreground">
              Type: <span className={`font-semibold ${stats.isIrregular ? 'text-yellow-600' : 'text-green-600'}`}>
                {stats.isIrregular ? "Irregular" : "Regular"}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Total Cycles Tracked */}
      <div className="bg-accent-warm/10 border-2 border-accent-warm rounded-lg p-6">
        <div className="text-4xl mb-2">✓</div>
        <h3 className="font-semibold text-foreground mb-1">Cycles Tracked</h3>
        <p className="text-sm text-muted-foreground">{cycles.length} cycles logged</p>
      </div>
    </div>
  )
}
