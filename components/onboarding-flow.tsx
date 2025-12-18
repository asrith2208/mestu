"use client"

import { useState, useEffect } from "react"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { ArrowRight, ArrowLeft, Check, ClipboardList, Target, AlertCircle, Heart, Activity, Calendar, Droplets, Smile, Frown, Users, Info, ChevronRight, Zap, HeartPulse, CheckCircle, BatteryLow, Theater, Expand, Brain, CloudFog, Sparkles, ShieldCheck } from "lucide-react"

function ShieldCheckIcon(props: any) { return <ShieldCheck {...props} /> }
import { useLanguage } from "./language-context"

interface OnboardingFlowProps {
  onComplete: (userData: any) => void
}

const symptoms = [
  { id: "cramps", label: "Cramps", icon: Droplets },
  { id: "bloating", label: "Bloating", icon: CloudFog },
  { id: "fatigue", label: "Fatigue", icon: BatteryLow },
  { id: "mood", label: "Mood Swings", icon: Theater },
  { id: "headache", label: "Headache", icon: Brain },
]

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { t, setLanguage, language } = useLanguage()
  const [step, setStep] = useState(0)
  const [userData, setUserData] = useState({
    // Basics
    name: "",
    dob: "", // Changed from age to dob
    age: "", // Will be calculated
    height: "",
    weight: "",
    bmi: "",
    country: "India",

    // Cycle History
    firstPeriodAge: "",
    cycleLength: "28",
    periodDuration: "5",
    flowIntensity: "moderate",
    // We will now store a history array. lastPeriodDate will still be derived from the most recent one.
    periodHistory: [{
      startDate: "",
      endDate: ""
    }, {
      startDate: "",
      endDate: ""
    }, {
      startDate: "",
      endDate: ""
    }], // Default 3 empty slots
    lastPeriodDate: "", // Derived
    periodRegularity: "somewhat",
    missedPeriodFreq: "rarely",

    // PCOS & Health
    pcosStatus: "unsure",
    diagnosisDate: "",
    coMorbidities: [] as string[],

    // Standard
    conditions: [] as string[],
    symptoms: [] as string[],
    painLevel: "5",
    goals: [] as string[],

    // Lifestyle
    activityLevel: "moderate",
    sleepHours: "7-8",
    dietType: "mixed",
    stressLevel: "medium",

    // Repro
    tryingToConceive: false
  })

  // Helper to calculate BMI
  const updateBMI = (h: string, w: string) => {
    const heightM = parseFloat(h) / 100
    const weightKg = parseFloat(w)
    if (heightM > 0 && weightKg > 0) {
      return (weightKg / (heightM * heightM)).toFixed(1)
    }
    return ""
  }

  // Helper to calculate Age
  const calculateAge = (dob: string) => {
    if (!dob) return ""
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age.toString()
  }

  // Effect to update age whenever DOB changes
  useEffect(() => {
    if (userData.dob) {
      setUserData(prev => ({ ...prev, age: calculateAge(prev.dob) }))
    }
  }, [userData.dob])


  const handleConditionToggle = (conditionId: string) => {
    setUserData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(conditionId)
        ? prev.conditions.filter((c) => c !== conditionId)
        : [...prev.conditions, conditionId],
    }))
  }

  const handleCoMorbidityToggle = (id: string) => {
    setUserData((prev) => ({
      ...prev,
      coMorbidities: prev.coMorbidities.includes(id)
        ? prev.coMorbidities.filter(c => c !== id)
        : [...prev.coMorbidities, id]
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
    // Validation Step 1: Identity (Mandatory)
    if (step === 1) {
      if (!userData.name.trim() || !userData.dob || !userData.height || !userData.weight) {
        alert("All fields are mandatory. Please complete your profile.")
        return
      }
    }

    // Validation Step 2: Cycle (Mandatory)
    if (step === 2) {
      // Validate at least one history entry is filled
      const validHistory = userData.periodHistory.filter(h => h.startDate && h.endDate)
      if (validHistory.length === 0) {
        alert("Please provide at least the most recent period dates.")
        return
      }

      // Auto-calculate cycle length and last period date from history if not manually set?
      // Actually, let's trust the user input but we MUST set lastPeriodDate for app compatibility
      // Sort history by startDate desc
      const sortedHistory = [...validHistory].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

      setUserData(prev => ({
        ...prev,
        lastPeriodDate: sortedHistory[0].startDate
      }))
    }

    // Validation Step 3: PCOS/Conditions (Mandatory selection)
    if (step === 3 && userData.pcosStatus === "") {
      alert("Please select your PCOS status.")
      return
    }

    if (step < 7) {
      setStep(step + 1)
    } else {
      try {
        const user = auth.currentUser
        if (user) {
          // Final Calculation Check
          const finalAge = calculateAge(userData.dob)

          await setDoc(doc(db, "users", user.uid), {
            ...userData,
            age: finalAge, // Ensure explicit age save
            bmi: userData.bmi || updateBMI(userData.height, userData.weight),
            // We storedob as well
            isOnboardingComplete: true,
            createdAt: new Date().toISOString(),
            email: user.email,
            phoneNumber: user.phoneNumber,
          })
          localStorage.setItem("saukhya_user", JSON.stringify(userData))
          localStorage.setItem("saukhya_onboarding_complete", "true")
          onComplete(userData)
        }
      } catch (error) {
        console.error("Save error", error)
      }
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const progressPercent = ((step + 1) / 8) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

        {/* Header */}
        {step > -1 && (
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
        )}

        {/* Content Area */}
        <div className="p-8 min-h-[400px] flex flex-col justify-center">

          {/* Step -1 & 0 (Language/Welcome) */}


          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('welcome')}</h1>
              <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
                Your journey to better hormonal health starts here.
              </p>
              <button onClick={handleNext} className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5">
                {t('getStarted')} <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Step 1: Identity & Body */}
          {step === 1 && (
            <div className="space-y-6 max-w-md mx-auto w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile & Basics</h2>
              <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 mb-4 border border-yellow-100">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                All fields are mandatory for accurate health tracking.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none" placeholder="Your Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input type="date" value={userData.dob} onChange={(e) => setUserData({ ...userData, dob: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white" value={userData.country} onChange={(e) => setUserData({ ...userData, country: e.target.value })}>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm) *</label>
                  <input type="number" value={userData.height}
                    onChange={(e) => {
                      const bmi = updateBMI(e.target.value, userData.weight)
                      setUserData({ ...userData, height: e.target.value, bmi: bmi as string })
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none" placeholder="160" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) *</label>
                  <input type="number" value={userData.weight}
                    onChange={(e) => {
                      const bmi = updateBMI(userData.height, e.target.value)
                      setUserData({ ...userData, weight: e.target.value, bmi: bmi as string })
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none" placeholder="60" />
                </div>
              </div>
              {userData.bmi && (
                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span>Your BMI is <strong>{userData.bmi}</strong>. (Age: {userData.age})</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Menstrual History */}
          {step === 2 && (
            <div className="space-y-6 max-w-md mx-auto w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Menstrual History</h2>
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-2 leading-relaxed border border-blue-100">
                <Info className="w-5 h-5 inline mr-2 text-blue-600 mb-1" />
                <strong>3-Month History Required</strong><br />
                To provide accurate predictions, please enter the Start and End dates for your last 3 periods.
                Estimate if exact dates are unavailable.
              </div>

              <div className="space-y-6">
                {/* Period History Inputs */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-900">Recent Period History</label>
                  {userData.periodHistory.map((entry, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {index === 0 ? "Most Recent" : `Cycle ${index + 1} ago`}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={entry.startDate}
                            onChange={(e) => {
                              const newHistory = [...userData.periodHistory]
                              newHistory[index].startDate = e.target.value
                              setUserData({ ...userData, periodHistory: newHistory })
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">End Date</label>
                          <input
                            type="date"
                            value={entry.endDate}
                            onChange={(e) => {
                              const newHistory = [...userData.periodHistory]
                              newHistory[index].endDate = e.target.value
                              setUserData({ ...userData, periodHistory: newHistory })
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="border-gray-100" />

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age at First Period</label>
                    <input type="number" value={userData.firstPeriodAge} onChange={(e) => setUserData({ ...userData, firstPeriodAge: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary outline-none" placeholder="e.g. 13" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Regularity</label>
                    <div className="flex flex-wrap gap-2">
                      {["Regular", "Somewhat", "Irregular", "No Periods"].map(opt => (
                        <button key={opt}
                          onClick={() => setUserData({ ...userData, periodRegularity: opt.toLowerCase() })}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${userData.periodRegularity === opt.toLowerCase() ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Step 3: PCOS & Diagnosis */}
          {step === 3 && (
            <div className="space-y-6 max-w-md mx-auto w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">PCOS Status</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-medium text-gray-800 mb-3">Have you been diagnosed with PCOS? *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ val: "yes", label: "Yes" }, { val: "no", label: "No" }, { val: "unsure", label: "Not Sure" }].map(opt => (
                      <button key={opt.val}
                        onClick={() => {
                          setUserData({ ...userData, pcosStatus: opt.val })
                          if (opt.val === 'yes') {
                            if (!userData.conditions.includes('pcos')) handleConditionToggle('pcos')
                          }
                        }}
                        className={`p-4 rounded-xl border-2 text-center font-bold transition-all ${userData.pcosStatus === opt.val ? 'border-primary bg-primary/10 text-primary' : 'border-gray-100 text-gray-500 hover:border-primary/20'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {userData.pcosStatus === 'yes' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approximate Year of Diagnosis</label>
                    <input type="number" placeholder="e.g. 2020" className="w-full px-4 py-3 rounded-xl border border-gray-200"
                      value={userData.diagnosisDate} onChange={(e) => setUserData({ ...userData, diagnosisDate: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Health Concerns (Optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {[{ id: "thyroid", label: "Thyroid" }, { id: "diabetes", label: "Diabetes/Insulin" }, { id: "endo", label: "Endometriosis" }].map(c => (
                      <button key={c.id}
                        onClick={() => handleCoMorbidityToggle(c.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${userData.coMorbidities.includes(c.id) ? 'bg-accent-purple text-white border-accent-purple' : 'bg-white text-gray-500 border-gray-200'}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Symptoms (PCOS Focused) */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">PCOS & Common Symptoms</h2>
              <p className="text-gray-500 mb-4 text-sm">Select all that apply to help us create your symptom profile.</p>

              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {/* PCOS Specific */}
                <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">PCOS / Metabolic</div>
                {[
                  { id: "hirsutism", label: "Excess Facial Hair", icon: Zap },
                  { id: "hairloss", label: "Hair Thinning", icon: Frown },
                  { id: "weightgain", label: "Rapid Weight Gain", icon: Activity },
                  { id: "acne", label: "Cystic Acne", icon: Sparkles },
                  { id: "cravings", label: "Sugar Cravings", icon: Heart }
                ].map(s => (
                  <button key={s.id} onClick={() => handleSymptomToggle(s.label)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${userData.symptoms.includes(s.label) ? "bg-accent-purple/10 border-accent-purple text-accent-purple" : "bg-white border-gray-100 text-gray-600"}`}>
                    <div className={`p-1.5 rounded-lg ${userData.symptoms.includes(s.label) ? "bg-accent-purple text-white" : "bg-gray-100/50 text-gray-400"}`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{s.label}</span>
                  </button>
                ))}

                <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Standard Phase</div>
                {symptoms.map(s => (
                  <button key={s.id} onClick={() => handleSymptomToggle(s.label)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${userData.symptoms.includes(s.label) ? "bg-accent-warm/10 border-accent-warm text-accent-warm-dark" : "bg-white border-gray-100 text-gray-600"}`}>
                    <div className={`p-1.5 rounded-lg ${userData.symptoms.includes(s.label) ? "bg-accent-warm text-white" : "bg-gray-100/50 text-gray-400"}`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Goals */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Primary Goals</h2>
              <div className="space-y-3">
                {[
                  { id: "track", label: "Understand my body & cycles", icon: Calendar },
                  { id: "symptoms", label: "Reduce symptoms (Acne, Mood)", icon: Smile },
                  { id: "weight", label: "Manage weight / metabolism", icon: Activity },
                  { id: "conceive", label: "Improve fertility / Plan pregnancy", icon: Heart },
                  { id: "simple", label: "Just simple tracking", icon: ClipboardList }
                ].map(g => {
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
                      </div>
                      {isSelected && <Check className="ml-auto w-6 h-6 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 6: Lifestyle Snapshot */}
          {step === 6 && (
            <div className="space-y-6 max-w-md mx-auto w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lifestyle Snapshot</h2>
              <p className="text-gray-500 mb-4">We use this to suggest small, achievable habits.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Typical Activity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Sedentary", "Moderate", "Active"].map(l => (
                    <button key={l} onClick={() => setUserData({ ...userData, activityLevel: l.toLowerCase() })}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${userData.activityLevel === l.toLowerCase() ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diet Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Home Cooked", "Mixed", "Fast Food/Processed", "Vegetarian"].map(d => (
                    <button key={d} onClick={() => setUserData({ ...userData, dietType: d.toLowerCase() })}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${userData.dietType === d.toLowerCase() ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Average Sleep</label>
                <input type="range" min="4" max="12" step="0.5"
                  value={parseFloat(userData.sleepHours) || 7}
                  onChange={(e) => setUserData({ ...userData, sleepHours: e.target.value.toString() })}
                  className="w-full h-2 bg-gray-200 rounded-lg accent-primary" />
                <div className="text-center mt-2 font-bold text-primary">{userData.sleepHours} Hours</div>
              </div>
            </div>
          )}

          {/* Step 7: Reproductive Health */}
          {step === 7 && (
            <div className="space-y-6 max-w-md mx-auto w-full text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Final Check</h2>
              <p className="text-gray-500 mb-8">Are you currently trying to conceive?</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button onClick={() => setUserData({ ...userData, tryingToConceive: true })}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${userData.tryingToConceive ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 bg-white hover:border-primary/20'}`}>
                  <Heart className={`w-8 h-8 ${userData.tryingToConceive ? 'text-primary' : 'text-gray-400'}`} />
                  <span className="font-bold text-gray-800">Yes, trying</span>
                </button>

                <button onClick={() => setUserData({ ...userData, tryingToConceive: false })}
                  className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${!userData.tryingToConceive ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 bg-white hover:border-primary/20'}`}>
                  <Calendar className={`w-8 h-8 ${!userData.tryingToConceive ? 'text-primary' : 'text-gray-400'}`} />
                  <span className="font-bold text-gray-800">No, just tracking</span>
                </button>
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-green-800 text-sm">
                <ShieldCheckIcon className="w-5 h-5 mx-auto mb-1 text-green-600" />
                Your data is encrypted and private. We use it only to personalize your insights.
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step > 0 && (
          <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
            <button onClick={handleBack} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Back</button>
            <button onClick={handleNext} className="flex-1 bg-primary text-white rounded-xl font-bold py-3 hover:bg-primary-light transition-all shadow-lg shadow-primary/20">
              {step === 7 ? "Complete Profile" : "Continue"}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
