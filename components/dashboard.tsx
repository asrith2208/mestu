"use client"

import { useState, useEffect } from "react"
import { doc, setDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Activity, Scale, Check } from "lucide-react"

interface DashboardProps {
  user: any
}

export default function Dashboard({ user }: DashboardProps) {
  const [upcomingPeriod, setUpcomingPeriod] = useState<string>("")
  const [cyclePhase, setCyclePhase] = useState<string>("")
  const [daysInCycle, setDaysInCycle] = useState<number>(0)

  // Vitals State
  const [weight, setWeight] = useState(user?.weight || "")
  const [currentBMI, setCurrentBMI] = useState(user?.bmi || "")
  const [isSavingWeight, setIsSavingWeight] = useState(false)

  useEffect(() => {
    try {
      if (user) {
        setWeight(user.weight || "")
        setCurrentBMI(user.bmi || "")
      }

      if (user?.lastPeriodDate) {
        const lastPeriodDate = new Date(user.lastPeriodDate)
        const cycleLength = Number.parseInt(user?.cycleLength || "28")
        const periodDuration = Number.parseInt(user?.periodDuration || "5")

        // Calculate next period
        const nextPeriod = new Date(lastPeriodDate.getTime() + cycleLength * 24 * 60 * 60 * 1000)
        setUpcomingPeriod(nextPeriod.toLocaleDateString())

        // Calculate current position in cycle
        const today = new Date()
        const daysElapsed = Math.floor((today.getTime() - lastPeriodDate.getTime()) / (24 * 60 * 60 * 1000))
        const dayInCycle = daysElapsed % cycleLength

        setDaysInCycle(dayInCycle)

        // Determine cycle phase
        if (dayInCycle < periodDuration) {
          setCyclePhase("Menstruation")
        } else if (dayInCycle < periodDuration + 8) {
          setCyclePhase("Follicular")
        } else if (dayInCycle < periodDuration + 13) {
          setCyclePhase("Ovulation")
        } else {
          setCyclePhase("Luteal")
        }
      }
    } catch (error) {
      console.log("[v0] Error loading dashboard data:", error)
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
      alert("Weight logged successfully!")
    } catch (e) {
      console.error("Error saving weight", e)
      setIsSavingWeight(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user?.name || "Friend"}</h2>
        <p className="text-muted-foreground">
          {user?.conditions?.length > 0
            ? `Managing ${user.conditions.join(", ")} - You're doing great`
            : "Your menstrual health companion"}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-primary/10 border-2 border-primary rounded-lg p-6">
          <div className="text-primary text-4xl mb-2">📅</div>
          <h3 className="font-semibold text-foreground mb-2">Current Phase</h3>
          <p className="text-muted-foreground text-sm">
            {cyclePhase || "Select Phase"} - Day {daysInCycle + 1} of {user?.cycleLength || "28"}
          </p>
        </div>

        <div className="bg-accent-warm/10 border-2 border-accent-warm rounded-lg p-6">
          <div className="text-accent-warm text-4xl mb-2">📊</div>
          <h3 className="font-semibold text-foreground mb-2">Next Period</h3>
          <p className="text-muted-foreground text-sm">
            {user?.nextPredictedPeriod
              ? `Predicted: ${new Date(user.nextPredictedPeriod).toLocaleDateString()}`
              : upcomingPeriod
                ? `Predicted: ${upcomingPeriod}`
                : "Add last period date"}
          </p>
        </div>

        {/* BMI Card (New) */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 relative">
          <div className="flex justify-between items-start mb-2">
            <div className="text-blue-500 text-4xl"><Scale className="w-8 h-8" /></div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-900">{currentBMI || "--"}</span>
              <span className="block text-xs text-blue-600 font-bold uppercase">BMI</span>
            </div>
          </div>
          <h3 className="font-semibold text-foreground mb-3">Daily Weight</h3>

          <div className="flex gap-2">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="kg"
              className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              onClick={handleSaveWeight}
              disabled={isSavingWeight}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center min-w-[50px]"
            >
              {isSavingWeight ? <Activity className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-lg p-6 shadow-sm mb-8">
        <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-smooth">
            Log Period
          </button>
          <button className="bg-accent-warm hover:bg-accent-warm/90 text-white font-semibold py-3 px-4 rounded-lg transition-smooth">
            Log Symptoms & Pain
          </button>
          <button className="bg-accent-purple hover:bg-accent-purple/90 text-white font-semibold py-3 px-4 rounded-lg transition-smooth">
            Book Doctor Consultation
          </button>
          <button className="bg-primary-light hover:bg-primary-light/90 text-white font-semibold py-3 px-4 rounded-lg transition-smooth">
            Find Community Support
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary to-primary-light rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-2">💡 Tip for Today</h3>
        <p className="text-sm">
          {user?.painLevel > 7
            ? "High pain days are common with your condition. Try gentle movement and heat therapy to manage discomfort."
            : "Tracking your symptoms helps identify patterns and triggers specific to your condition."}
        </p>
      </div>
    </div>
  )
}
