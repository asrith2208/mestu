"use client"

import { useState } from "react"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { ArrowRight, ArrowLeft, Check, ClipboardList, Target, AlertCircle, Heart, Activity, Calendar, Droplets, Smile, Frown, Users, Info, ChevronRight, Zap, HeartPulse, CheckCircle, BatteryLow, Theater, Expand, Brain, CloudFog, Sparkles } from "lucide-react"

interface OnboardingFlowProps {
  onComplete: (userData: any) => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [userData, setUserData] = useState({
    name: "",
    age: "",
    cycleLength: "28",
    periodDuration: "5",
    flowIntensity: "moderate",
    lastPeriodDate: "",
    conditions: [] as string[],
    symptoms: [] as string[],
    painLevel: "5",
    goals: [] as string[],
  })

  const conditions = [
    { id: "pcos", label: "PCOS", icon: Activity },
    { id: "endometriosis", label: "Endometriosis", icon: Zap },
    { id: "pmdd", label: "PMDD", icon: Frown },
    { id: "fibroids", label: "Fibroids", icon: Target },
    { id: "adenomyosis", label: "Adenomyosis", icon: HeartPulse },
    { id: "heavy-bleeding", label: "Heavy Bleeding", icon: Droplets },
    { id: "irregular", label: "Irregular Cycles", icon: Calendar },
    { id: "none", label: "Not Diagnosed", icon: CheckCircle },
  ]

  // Note: Using some generic icons for these if specifics aren't imported or available, otherwise mapping them best effort
  // Let's add the imports needed:
  // Re-define imports above to include what we need. 
  // Zap, HeartPulse, CheckCircle needed.

  const symptoms = [
    { id: "cramps", label: "Severe cramping", icon: Zap },
    { id: "bleeding", label: "Heavy bleeding", icon: Droplets },
    { id: "fatigue", label: "Fatigue", icon: BatteryLow },
    { id: "mood", label: "Mood changes", icon: Theater }, // Theater masks for mood? Or Frown/Smile
    { id: "bloating", label: "Bloating", icon: Expand },
    { id: "headache", label: "Headaches", icon: Brain },
    { id: "nausea", label: "Nausea", icon: Frown }, // Generic sick face
    { id: "backpain", label: "Back pain", icon: Activity },
    { id: "brainfog", label: "Brain fog", icon: CloudFog },
    { id: "acne", label: "Acne", icon: Sparkles },
  ]

  const goals = [
    { id: "track", label: "Track symptoms for doctor", icon: ClipboardList },
    { id: "pain", label: "Manage pain better", icon: Heart },
    { id: "patterns", label: "Understand cycle patterns", icon: Calendar },
    { id: "community", label: "Find community support", icon: Users },
    { id: "learn", label: "Learn about my condition", icon: Info },
    { id: "wellbeing", label: "Improve overall wellbeing", icon: Smile },
  ]

  const handleConditionToggle = (conditionId: string) => {
    setUserData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(conditionId)
        ? prev.conditions.filter((c) => c !== conditionId)
        : [...prev.conditions, conditionId],
    }))
  }

  const handleSymptomToggle = (symptomLabel: string) => {
    setUserData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptomLabel)
        ? prev.symptoms.filter((s) => s !== symptomLabel)
        : [...prev.symptoms, symptomLabel],
    }))
  }

  const handleGoalToggle = (goalLabel: string) => {
    setUserData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goalLabel) ? prev.goals.filter((g) => g !== goalLabel) : [...prev.goals, goalLabel],
    }))
  }

  const handleNext = async () => {
    // Validation
    if (step === 1) {
      if (!userData.name.trim() || !userData.age.trim()) {
        alert("Please enter your name and age to continue.")
        return
      }
    }

    if (step < 6) {
      setStep(step + 1)
    } else {
      try {
        const user = auth.currentUser
        if (user) {
          await setDoc(doc(db, "users", user.uid), {
            ...userData,
            isOnboardingComplete: true,
            createdAt: new Date().toISOString(),
            email: user.email,
            phoneNumber: user.phoneNumber,
          })
          localStorage.setItem("saukhya_user", JSON.stringify(userData))
          localStorage.setItem("saukhya_onboarding_complete", "true")

          onComplete(userData)
        } else {
          // Fallback
          localStorage.setItem("saukhya_user", JSON.stringify(userData))
          localStorage.setItem("saukhya_onboarding_complete", "true")
          onComplete(userData)
        }
      } catch (error) {
        console.error("Error saving user profile to Firestore:", error)
        alert("There was an error saving your profile. Please try again.")
      }
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const progressPercent = ((step + 1) / 7) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

        {/* Header / Progress */}
        <div className="bg-white p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Step {step + 1} of 7</span>
            {step > 0 && (
              <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8 min-h-[400px] flex flex-col justify-center">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Saukhya</h1>
              <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
                Your intelligent companion for menstrual health. Let's personalize your experience.
              </p>
              <button onClick={handleNext} className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5">
                Get Started <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Step 1: Identity */}
          {step === 1 && (
            <div className="space-y-6 max-w-md mx-auto w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What should we call you?</label>
                  <input
                    type="text"
                    value={userData.name}
                    onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">How old are you?</label>
                  <input
                    type="number"
                    value={userData.age}
                    onChange={(e) => setUserData({ ...userData, age: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="Age"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Cycle */}
          {step === 2 && (
            <div className="space-y-6 max-w-md mx-auto w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Cycle Details</h2>
              <p className="text-gray-500 mb-4">These help us predict your next period correctly.</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cycle Length</label>
                  <input type="number" value={userData.cycleLength} onChange={(e) => setUserData({ ...userData, cycleLength: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:primary-ring" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Period Duration</label>
                  <input type="number" value={userData.periodDuration} onChange={(e) => setUserData({ ...userData, periodDuration: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:primary-ring" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Last Period Start</label>
                <input type="date" value={userData.lastPeriodDate} onChange={(e) => setUserData({ ...userData, lastPeriodDate: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:primary-ring" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Usually Flow</label>
                <div className="grid grid-cols-4 gap-2">
                  {["light", "moderate", "heavy", "very-heavy"].map(flow => (
                    <button
                      key={flow}
                      onClick={() => setUserData({ ...userData, flowIntensity: flow })}
                      className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${userData.flowIntensity === flow ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary/50"}`}
                    >
                      {flow.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Conditions */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 font-center">Diagnosed Conditions</h2>
              <div className="grid grid-cols-2 gap-3">
                {conditions.map(c => {
                  const Icon = c.icon
                  const isSelected = userData.conditions.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleConditionToggle(c.id)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 flex flex-col items-center justify-center gap-2 group ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-gray-100 bg-white hover:border-primary/30 hover:shadow-sm"}`}
                    >
                      <div className={`p-2 rounded-full transition-colors ${isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary"}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-gray-700"}`}>{c.label}</span>
                      {isSelected && <div className="absolute top-2 right-2 text-primary"><Check className="w-4 h-4" /></div>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 4: Symptoms */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Symptoms</h2>
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {symptoms.map(s => {
                  const Icon = s.icon
                  const isSelected = userData.symptoms.includes(s.label)
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSymptomToggle(s.label)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? "bg-accent-warm/10 border-accent-warm text-accent-warm-dark shadow-sm" : "bg-white border-gray-100 text-gray-600 hover:border-accent-warm/30"}`}
                    >
                      <div className={`p-1.5 rounded-lg ${isSelected ? "bg-accent-warm text-white" : "bg-gray-100 text-gray-400"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{s.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 5: Pain */}
          {step === 5 && (
            <div className="text-center space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Typical Pain Level</h2>

              <div className="relative pt-6 pb-2">
                <div className="text-6xl font-black text-primary mb-2 transition-all transform scale-100">{userData.painLevel}</div>
                <p className="text-sm text-gray-500 font-medium tracking-widest uppercase">Scale of 1 to 10</p>
              </div>

              <div className="max-w-md mx-auto px-6">
                <input
                  type="range"
                  min="0" max="10" step="1"
                  value={userData.painLevel}
                  onChange={(e) => setUserData({ ...userData, painLevel: e.target.value })}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary-light"
                />
                <div className="flex justify-between mt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>No Pain</span>
                  <span>Unbearable</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Goals */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Goals</h2>
              <div className="space-y-3">
                {goals.map(g => {
                  const Icon = g.icon
                  const isSelected = userData.goals.includes(g.label)
                  return (
                    <button
                      key={g.id}
                      onClick={() => handleGoalToggle(g.label)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isSelected ? "border-primary bg-primary/5" : "border-gray-100 bg-white hover:border-primary/20"}`}
                    >
                      <div className={`p-3 rounded-full ${isSelected ? "bg-primary text-white shadow-md" : "bg-gray-50 text-gray-400"}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <span className={`block font-bold text-lg ${isSelected ? "text-primary" : "text-gray-700"}`}>{g.label}</span>
                        <span className="text-xs text-gray-500">Tap to select</span>
                      </div>
                      {isSelected && <Check className="ml-auto w-6 h-6 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step > 0 && (
          <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
            <button onClick={handleBack} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Back</button>
            <button onClick={handleNext} className="flex-1 bg-primary text-white rounded-xl font-bold py-3 hover:bg-primary-light transition-all shadow-lg shadow-primary/20">
              {step === 6 ? "Complete Profile" : "Continue"}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}


