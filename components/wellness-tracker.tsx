"use client"

import { useState, useEffect } from "react"
import { Droplets, Moon, Activity, Plus, Minus, Check, Trophy } from "lucide-react"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

interface WellnessTrackerProps {
  date: string
}

export default function WellnessTracker({ date }: WellnessTrackerProps) {
  const [hydration, setHydration] = useState(0)
  const [sleep, setSleep] = useState(7)
  const [exercise, setExercise] = useState(0)

  const [loading, setLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Confetti/Success States
  const [showGoalSuccess, setShowGoalSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return
      try {
        const docRef = doc(db, "users", auth.currentUser.uid, "wellness_logs", date)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setHydration(data.hydration || 0)
          setSleep(data.sleep || 7)
          setExercise(data.exercise || 0)
        } else {
          // Reset
          setHydration(0)
          setSleep(7)
          setExercise(0)
        }
      } catch (e) {
        console.error("Error fetching logs", e)
      }
    }
    fetchData()
  }, [date])

  const handleSave = async (autoData?: any) => {
    if (!auth.currentUser) return

    const dataToSave = autoData || { hydration, sleep, exercise }

    try {
      setLoading(true)
      await setDoc(doc(db, "users", auth.currentUser.uid, "wellness_logs", date), {
        ...dataToSave,
        date // ensure date is saved
      }, { merge: true })

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (e) {
      console.error("Save failed", e)
    } finally {
      setLoading(false)
    }
  }

  // Auto-trigger goals
  useEffect(() => {
    if (hydration === 8) setShowGoalSuccess("Hydration")
    if (sleep === 8) setShowGoalSuccess("Sleep")
    if (exercise === 30) setShowGoalSuccess("Exercise")

    if (showGoalSuccess) {
      const timer = setTimeout(() => setShowGoalSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [hydration, sleep, exercise])

  return (
    <div className="space-y-4">

      {/* Success Popup */}
      {showGoalSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in slide-in-from-bottom-5">
          <div className="bg-yellow-400 text-yellow-900 font-bold px-6 py-3 rounded-full shadow-xl flex items-center gap-2">
            <Trophy className="w-5 h-5 fill-yellow-700" />
            {showGoalSuccess} Goal Met!
          </div>
        </div>
      )}

      {/* COMPACT CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

        {/* Hydration - BLUE THEME */}
        <div className="bg-gradient-to-br from-[#0096c7] to-[#48cae4] rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Droplets className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-black leading-none">{hydration}</p>
              <p className="text-[10px] opacity-80 uppercase font-bold">Glasses</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => { setHydration(h => h + 1); handleSave({ hydration: hydration + 1, sleep, exercise }) }}
              className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg p-2 flex items-center justify-center transition-colors">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={() => { setHydration(h => Math.max(0, h - 1)); handleSave({ hydration: Math.max(0, hydration - 1), sleep, exercise }) }}
              className="flex-1 bg-black/10 hover:bg-black/20 rounded-lg p-2 flex items-center justify-center transition-colors">
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sleep - BLUE THEME (Requested Uniformity) */}
        <div className="bg-gradient-to-br from-[#4361ee] to-[#4cc9f0] rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Moon className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-black leading-none">{sleep}</p>
              <p className="text-[10px] opacity-80 uppercase font-bold">Hours</p>
            </div>
          </div>

          <input
            type="range" min="4" max="12" step="0.5" value={sleep}
            onChange={(e) => {
              setSleep(parseFloat(e.target.value))
              // don't auto-save slider excessively, rely on manual save or effect debounce if needed
            }}
            onMouseUp={() => handleSave()}
            onTouchEnd={() => handleSave()}
            className="w-full h-1 bg-black/20 rounded-full appearance-none cursor-pointer mt-4 accent-white"
          />
        </div>

        {/* Activity - BLUE THEME (Requested Uniformity) */}
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#3f37c9] to-[#4361ee] rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-black leading-none">{exercise}</p>
              <p className="text-[10px] opacity-80 uppercase font-bold">Mins</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => { setExercise(e => e + 15); handleSave({ hydration, sleep, exercise: exercise + 15 }) }}
              className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg py-2 text-xs font-bold transition-all">
              +15 Min
            </button>
            <button onClick={() => { setExercise(e => Math.max(0, e - 15)); handleSave({ hydration, sleep, exercise: Math.max(0, exercise - 15) }) }}
              className="w-10 bg-black/10 hover:bg-black/20 rounded-lg flex items-center justify-center">
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>



      {/* Auto-Save & Status Indicator */}
      <div className="flex justify-center items-center py-2 h-8">
        {loading ? (
          <span className="text-xs font-medium text-gray-400 animate-pulse flex items-center gap-1">
            Saving...
          </span>
        ) : isSaved ? (
          <span className="text-xs font-medium text-green-500 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1">
            <Check className="w-3 h-3" /> Saved
          </span>
        ) : (
          <span className="text-[10px] text-gray-300">Changes save automatically</span>
        )}
      </div>
    </div >
  )
}
