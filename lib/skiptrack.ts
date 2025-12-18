/**
 * SkipTrack Bayesian Menstrual Cycle Prediction (TypeScript Implementation)
 * 
 * This implements a Bayesian Normal-Inverse-Gamma conjugate prior model
 * to predict cycle lengths while accounting for "skips" in tracking.
 */

export interface SkipTrackResult {
    meanCycleLength: number;
    ci80Lower: number;
    ci80Upper: number;
    skipProbability: number;
}

export function predictNextCycle(cycleLengths: number[]): SkipTrackResult {
    const lengths = [...cycleLengths];

    if (lengths.length === 0) {
        return {
            meanCycleLength: 28,
            ci80Lower: 21,
            ci80Upper: 35,
            skipProbability: 0.05
        };
    }

    // 1. Skip Detection & Cleaning
    // If a cycle is significantly longer than the median, it's likely a skip.
    const sorted = [...lengths].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const cleanedLengths = lengths.flatMap(len => {
        if (len > 1.6 * median && len < 2.4 * median) return [len / 2, len / 2];
        if (len > 2.6 * median && len < 3.4 * median) return [len / 3, len / 3, len / 3];
        return [len];
    });

    // 2. Bayesian Update (Normal-Inverse-Gamma)
    // Priors
    const priorMu = 28;
    const priorN = 1;
    const priorA = 2;
    const priorB = 20; // Variance prior

    const n = cleanedLengths.length;
    const sampleMean = cleanedLengths.reduce((a, b) => a + b, 0) / n;
    const sampleSumSqDiff = cleanedLengths.reduce((a, b) => a + Math.pow(b - sampleMean, 2), 0);

    // Posterior parameters
    const postN = priorN + n;
    const postMu = (priorN * priorMu + n * sampleMean) / postN;
    const postA = priorA + n / 2;
    const postB = priorB + 0.5 * (sampleSumSqDiff + (priorN * n * Math.pow(sampleMean - priorMu, 2)) / postN);

    // Expected values
    const expectedMu = postMu;
    const expectedVar = postB / (postA - 1);
    const sd = Math.sqrt(expectedVar);

    // 80% Confidence Interval (z=1.28)
    const ciLower = expectedMu - 1.28 * sd;
    const ciUpper = expectedMu + 1.28 * sd;

    // Skip Probability (Simplified)
    const skipCount = lengths.length !== cleanedLengths.length ? 1 : 0;
    const skipProb = (skipCount + 0.5) / (lengths.length + 1);

    return {
        meanCycleLength: Math.round(expectedMu * 100) / 100,
        ci80Lower: Math.round(ciLower * 100) / 100,
        ci80Upper: Math.round(ciUpper * 100) / 100,
        skipProbability: Math.round(skipProb * 1000) / 1000
    };
}

export function calculateCycleLengthsFromDates(startDates: string[]): number[] {
    if (startDates.length < 2) return [];

    const sorted = [...startDates]
        .map(d => new Date(d).getTime())
        .sort((a, b) => a - b);

    const lengths: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
        const diffDays = Math.round((sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24));
        lengths.push(diffDays);
    }
    return lengths;
}

export function addDays(date: string | Date, days: number): string {
    const result = new Date(date);
    result.setDate(result.getDate() + Math.round(days));
    return result.toISOString();
}

export function predictNextPeriodFromHistory(history: { startDate: string, endDate: string }[]): {
    nextStartDate: string,
    nextEndDate: string,
    meanCycleLength: number,
    meanPeriodDuration: number,
    confidence: number
} {
    const validHistory = history.filter(h => h.startDate && h.endDate);

    if (validHistory.length === 0) {
        return {
            nextStartDate: "",
            nextEndDate: "",
            meanCycleLength: 28,
            meanPeriodDuration: 5,
            confidence: 0
        };
    }

    // Sort by date descending (newest first)
    const sortedHistory = [...validHistory].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    // 1. Predict Cycle Length
    const startDates = sortedHistory.map(h => h.startDate);
    const cycleLengths = calculateCycleLengthsFromDates(startDates);
    const cyclePrediction = predictNextCycle(cycleLengths);

    // 2. Predict Period Duration (Average)
    const durations = validHistory.map(h => {
        const start = new Date(h.startDate).getTime();
        const end = new Date(h.endDate).getTime();
        return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
    });
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    // 3. Calculate Dates
    const nextStartDate = addDays(sortedHistory[0].startDate, cyclePrediction.meanCycleLength);
    const nextEndDate = addDays(nextStartDate, avgDuration - 1);

    // 4. Calculate Confidence (0-100)
    // Factors: number of cycles tracked, variance in cycle lengths
    let confidence = 0;
    if (validHistory.length === 1) confidence = 40;
    else if (validHistory.length === 2) confidence = 65;
    else if (validHistory.length >= 3) confidence = 85;

    // Penalty for high variance (if we have enough data)
    if (cycleLengths.length >= 2) {
        const mean = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
        const variance = cycleLengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / cycleLengths.length;
        const stdDev = Math.sqrt(variance);
        confidence -= (stdDev * 2);
    }

    return {
        nextStartDate,
        nextEndDate,
        meanCycleLength: cyclePrediction.meanCycleLength,
        meanPeriodDuration: Math.round(avgDuration),
        confidence: Math.max(10, Math.min(98, Math.round(confidence)))
    };
}
