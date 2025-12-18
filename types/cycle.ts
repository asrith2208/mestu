export interface Cycle {
    id?: string;
    user_id: string;
    startDate: string; // ISO string
    endDate: string;   // ISO string
    cycleLength?: number;
    flowIntensity?: 'light' | 'moderate' | 'heavy';
    notes?: string;
    createdAt: string;
}

export interface Prediction {
    user_id: string;
    predictedDate: string;
    confidenceIntervals: {
        lower: string;
        upper: string;
    };
    meanCycleLength: number;
    skipProbability: number;
    createdAt: string;
}

export interface UserProfile {
    id: string;
    email: string;
    age?: string;
    bmi?: string;
    conditions?: string[];
    cycleLength?: string;
    name?: string;
}

export interface SkipTrackResponse {
    mean_cycle_length: number;
    ci_80_lower: number;
    ci_80_upper: number;
    skip_probability: number;
}
