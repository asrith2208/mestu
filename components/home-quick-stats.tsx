import { useState, useEffect } from "react"
import { Calendar, Activity, Zap, Droplets, Scale, Check, Loader2 } from "lucide-react"
import { doc, setDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

interface HomeQuickStatsProps {
  user: any
}

export default function HomeQuickStats({ user }: HomeQuickStatsProps) {
  const [cycleData, setCycleData] = useState({
    phase: "",
    dayInCycle: 0,
    nextPeriod: "",
    daysUntilPeriod: 0,
    phaseColor: "from-emerald-500 to-emerald-600"
  })

  // Vitals State
  const [weight, setWeight] = useState(user?.weight || "")
  const [currentBMI, setCurrentBMI] = useState(user?.bmi || "")
  const [isSavingWeight, setIsSavingWeight] = useState(false)

  useEffect(() => {
    if (user) {
      setWeight(user.weight || "")
      setCurrentBMI(user.bmi || "")
    }

    if (user?.lastPeriodDate) {
      try {
        const lastPeriodDate = new Date(user.lastPeriodDate)
        // Validate date
        if (isNaN(lastPeriodDate.getTime())) {
          console.error("Invalid lastPeriodDate:", user.lastPeriodDate)
          return
        }

        const cycleLength = Number.parseInt(user?.cycleLength || "28")
        const periodDuration = Number.parseInt(user?.periodDuration || "5")

        const today = new Date()
        const diffTime = today.getTime() - lastPeriodDate.getTime()
        const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        // Calculate phase and day
        const currentCycleDay = (daysElapsed % cycleLength) + 1

        let daysUntil = cycleLength - currentCycleDay + 1
        // If daysElapsed is negative (future date?), handle it
        if (daysElapsed < 0) daysUntil = cycleLength

        // Calculate Next Period Date
        const nextPeriodDate = new Date(lastPeriodDate.getTime() + (Math.floor(daysElapsed / cycleLength) + 1) * cycleLength * 24 * 60 * 60 * 1000)

        // Determine Phase
        let phase = "Follicular" // Default
        let phaseColor = "from-emerald-500 to-emerald-600"

        if (currentCycleDay <= periodDuration) {
          phase = "Menstruation"
          phaseColor = "from-rose-500 to-rose-600"
        } else if (currentCycleDay <= periodDuration + 9) { // Roughly days 6-14 (Follicular)
          phase = "Follicular"
          phaseColor = "from-emerald-400 to-emerald-500" // Greenish, high energy
        } else if (currentCycleDay <= periodDuration + 11) { // Days 14-16 (Ovulation)
          phase = "Ovulation"
          phaseColor = "from-amber-400 to-amber-500" // Orange/Gold
        } else { // Days 17-28+
          phase = "Luteal"
          phaseColor = "from-violet-500 to-violet-600" // Purple
        }

        setCycleData({
          phase,
          dayInCycle: currentCycleDay,
          nextPeriod: nextPeriodDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          daysUntilPeriod: daysUntil,
          phaseColor
        } as any)

      } catch (error) {
        console.error("Error determining cycle stats", error)
      }
    } else {
      // Fallback or "Setup Needed"
      setCycleData(prev => ({ ...prev, phase: "Setup Needed", nextPeriod: "-", daysUntilPeriod: 0 }))
    }
  }, [user])

  const calculateBMI = (w: string) => {
    if (!user?.height) return ""
    const h_m = parseFloat(user.height) / 100
    const w_kg = parseFloat(w)
    if (h_m > 0 && w_kg > 0) return (w_kg / (h_m * h_m)).toFixed(1)
    return ""
  }

  const handleSaveWeight = async () => {
    if (!auth.currentUser || !weight) return
    setIsSavingWeight(true)
    try {
      const bmi = calculateBMI(weight)
      setCurrentBMI(bmi)

      const today = new Date().toISOString().split('T')[0]

      // 1. Log history
      await setDoc(doc(db, "users", auth.currentUser.uid, "wellness_logs", today), {
        weight: weight,
        bmi: bmi,
        date: today,
        timestamp: new Date().toISOString()
      }, { merge: true })

      // 2. Update Profile
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        weight: weight,
        bmi: bmi
      })

      setIsSavingWeight(false)
      // Optional: Trigger global refresh or alert
    } catch (e) {
      console.error("Error saving weight", e)
    } finally {
      setIsSavingWeight(false)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {/* Current Phase */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${cycleData.phaseColor || "from-emerald-500 to-emerald-600"} rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 group transition-transform hover:scale-[1.02]`}>
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
        <div className="flex justify-between items-start mb-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-black/10 px-2 py-1 rounded-md">Phase</span>
        </div>
        <div>
          <p className="font-bold text-lg leading-tight">{cycleData.phase || "Loading..."}</p>
          <p className="text-sm text-emerald-100 font-medium">Day {cycleData.dayInCycle + 1}</p>
        </div>
      </div>

      {/* Next Period */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20 group transition-transform hover:scale-[1.02]">
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex justify-between items-start mb-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-black/10 px-2 py-1 rounded-md">Next</span>
        </div>
        <div>
          <p className="font-bold text-2xl">
            {user?.nextPredictedPeriod
              ? Math.ceil((new Date(user.nextPredictedPeriod).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : cycleData.daysUntilPeriod}
            <span className="text-sm font-medium opacity-80"> days</span>
          </p>
          <p className="text-xs text-orange-100 mt-1">
            Expected {user?.nextPredictedPeriod
              ? new Date(user.nextPredictedPeriod).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : cycleData.nextPeriod}
          </p>
        </div>
      </div>

      {/* Daily Weight & BMI (Replaces Flow/Pain) */}
      <div className="col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Scale className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wide">Daily Weight</h3>
              <p className="text-xs text-blue-600/70">Update to track BMI</p>
            </div>
          </div>
          <div className="text-right bg-white/60 px-3 py-1 rounded-lg">
            <span className="block text-2xl font-bold text-blue-900 leading-none">{currentBMI || "--"}</span>
            <span className="text-[10px] text-blue-600 font-bold uppercase">BMI</span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Kg"
              className="w-full pl-3 pr-8 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-400 focus:ring-0 bg-white font-bold text-gray-700 outline-none transition-all"
            />
            <span className="absolute right-3 top-3.5 text-xs font-bold text-gray-400">KG</span>
          </div>
          <button
            onClick={handleSaveWeight}
            disabled={isSavingWeight || !weight}
            className="bg-blue-600 text-white px-6 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center min-w-[60px]"
          >
            {isSavingWeight ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Symptom Forecast */}
      <div className="col-span-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-purple-100 p-2 rounded-full mt-1">
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-purple-900 text-sm uppercase tracking-wide mb-1">Today's Forecast</h3>
            <p className="text-purple-800 font-medium text-lg leading-tight">
              {cycleData.phase === "Menstruation" ? "Cramps & fatigue likely. Keep warm." :
                cycleData.phase === "Follicular" ? "Energy rising! Great for exercise." :
                  cycleData.phase === "Ovulation" ? "Peak confidence & energy." :
                    cycleData.phase === "Luteal" ? "PMS risk. Be kind to yourself." :
                      cycleData.phase === "Setup Needed" ? "Complete profile to see predictions." :
                        "Tracking helps predict symptoms."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
