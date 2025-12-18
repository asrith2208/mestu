"use client"

import { useLanguage } from "./language-context"
import { predictNextCycle, calculateCycleLengthsFromDates, addDays, predictNextPeriodFromHistory } from "@/lib/skiptrack"

interface CycleInsightsProps {
  cycles: any[]
}

export default function CycleInsights({ cycles }: CycleInsightsProps) {
  const { t } = useLanguage()
  // Helper: Weighted Standard Deviation (simplified) or just use standard
  const getStandardDeviation = (array: number[]) => {
    if (array.length === 0) return 0
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
  }

  // AI Logic: Weighted Moving Average
  const calculateWeightedAverage = (lengths: number[]) => {
    if (lengths.length === 0) return 28
    // Weights: [1.0, 0.8, 0.6, ...] for recent to old
    // Limit to last 6 cycles for relevance
    const recentLengths = lengths.slice(0, 6)
    let weightSum = 0
    let weightedSum = 0

    recentLengths.forEach((len, i) => {
      const weight = Math.max(0.2, 1 - (i * 0.15)) // Decay weight
      weightedSum += len * weight
      weightSum += weight
    })

    return weightedSum / weightSum
  }

  const calculateCycleStats = () => {
    if (cycles.length < 2) return null

    // Ensure sorted descending (Newest first)
    const sortedCycles = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

    const startDates = sortedCycles.map(c => c.startDate)
    const cycleLengths = calculateCycleLengthsFromDates(startDates)

    if (cycleLengths.length === 0) return null

    const prediction = predictNextCycle(cycleLengths)
    const avgCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)

    const minCycleLength = Math.min(...cycleLengths)
    const maxCycleLength = Math.max(...cycleLengths)

    // Use Bayesian prediction for weighted length
    const weightedLength = prediction.meanCycleLength

    const stdDev = getStandardDeviation(cycleLengths)
    const isIrregular = stdDev > 3.5

    // AI Confidence Score from SkipTrack logic
    const historyResult = predictNextPeriodFromHistory(sortedCycles.map(c => ({ startDate: c.startDate, endDate: c.endDate })))
    const confidence = historyResult.confidence

    return {
      avgCycleLength,
      weightedLength,
      minCycleLength,
      maxCycleLength,
      stdDev,
      isIrregular,
      confidence,
      historyCount: cycleLengths.length
    }
  }

  const getNextPeriodPrediction = () => {
    const stats = calculateCycleStats()
    if (!stats) return null
    if (cycles.length === 0) return null

    // Correct: Use newest cycle start + predicted length
    // sortedCycles[0] is newest
    const sortedCycles = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    const lastStart = new Date(sortedCycles[0].startDate)

    // AI PREDICTION: Use Weighted Length
    const predictedLength = stats.weightedLength

    const nextDate = new Date(lastStart.getTime() + predictedLength * 24 * 60 * 60 * 1000)
    const today = new Date()
    // Reset time for accurate day calc
    nextDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    const margin = Math.ceil(stats.stdDev)
    const startRange = new Date(nextDate.getTime() - margin * 24 * 60 * 60 * 1000)
    const endRange = new Date(nextDate.getTime() + margin * 24 * 60 * 60 * 1000)

    return { nextPeriod: nextDate, daysUntil, isIrregular: stats.isIrregular, startRange, endRange, margin }
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
          <h3 className="font-semibold mb-1">{t('currentPhase')}</h3>
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
                {Math.round(stats.confidence)}% {t('confidence')}
              </div>
            )}
          </div>
          <h3 className="font-semibold text-foreground mb-1">{t('predictedStart')}</h3>

          {prediction.isIrregular ? (
            <div>
              <p className="text-lg font-bold text-primary">
                {prediction.startRange.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {prediction.endRange.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Due to irregularity (+/- {prediction.margin} {t('days')})
              </p>
            </div>
          ) : (
            <p className="text-lg font-bold text-primary">
              {prediction.nextPeriod.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          )}

          <p className="text-sm text-muted-foreground mt-2">
            {prediction.daysUntil > 0 ? `${t('inApprox')} ${prediction.daysUntil} ${t('days')}` : t('expectedSoon')}
          </p>
        </div>
      )}

      {/* Cycle Statistics */}
      {stats && (
        <div className="bg-primary-light/10 border-2 border-primary-light rounded-lg p-6">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="font-semibold text-foreground mb-3">{t('cycleStats')}</h3>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              {t('average')}: <span className="font-semibold text-foreground">{stats.avgCycleLength} {t('days')}</span>
            </p>
            <p className="text-muted-foreground">
              {t('range')}:{" "}
              <span className="font-semibold text-foreground">
                {stats.minCycleLength}-{stats.maxCycleLength} {t('days')}
              </span>
            </p>
            <p className="text-muted-foreground">
              {t('type')}: <span className={`font-semibold ${stats.isIrregular ? 'text-yellow-600' : 'text-green-600'}`}>
                {stats.isIrregular ? t('irregular') : t('regular')}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Total Cycles Tracked */}
      <div className="bg-accent-warm/10 border-2 border-accent-warm rounded-lg p-6">
        <div className="text-4xl mb-2">✓</div>
        <h3 className="font-semibold text-foreground mb-1">{t('cyclesTracked')}</h3>
        <p className="text-sm text-muted-foreground">{cycles.length} cycles logged</p>
      </div>
    </div>
  )
}
