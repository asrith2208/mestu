"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { format, addDays, differenceInDays, isAfter, isSameDay } from "date-fns"
import CycleCalendarStrip from "./cycle-calendar-strip"
import MonthCalendarModal from "./month-calendar-modal"
import { Droplets, Calendar as CalendarIcon, Activity, Plus, Edit2 } from "lucide-react"
import { doc, getDoc, setDoc, updateDoc, collection, query, onSnapshot, addDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

interface HomeHeroSectionProps {
    user: any
}

import DailyLogModal from "./daily-log-modal"
import EditPeriodModal from "./edit-period-modal"

export default function HomeHeroSection({ user }: HomeHeroSectionProps) {
    // State
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [isLogModalOpen, setIsLogModalOpen] = useState(false)
    const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false) // New State
    const [dayLogs, setDayLogs] = useState<any>(null)
    const [cycles, setCycles] = useState<any[]>([])

    const [isSaving, setIsSaving] = useState(false)
    const isUserInteraction = useRef(false) // Track if date change is from user

    // Wrapper for Date Selection
    const handleDateSelect = (date: Date) => {
        isUserInteraction.current = true
        setSelectedDate(date)
    }

    // Cycle Calculations (Dynamic based on selected Date)
    const [cycleDisplay, setCycleDisplay] = useState({
        title: "Day 1 of Cycle",
        phase: "Follicular"
    })

    // Derived state
    const isToday = isSameDay(selectedDate, new Date())
    const isFuture = isAfter(selectedDate, new Date()) && !isToday

    // Fetch Cycles for Calendar Highlighting
    useEffect(() => {
        const fetchCycles = async () => {
            if (!auth.currentUser) return
            try {
                const q = query(collection(db, "users", auth.currentUser.uid, "cycles"))
                const unsubscribe = onSnapshot(q, (snapshot: any) => {
                    const fetchedCycles = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    setCycles(fetchedCycles)
                })
                return () => unsubscribe()
            } catch (e) {
                console.error("Error fetching cycles", e)
            }
        }
        fetchCycles()
    }, [user])

    // Check if selected date is inside an existing cycle
    const existingCycle = useMemo(() => {
        const dateKey = format(selectedDate, 'yyyy-MM-dd')
        return cycles.find((c: any) => {
            return dateKey >= c.startDate && dateKey <= c.endDate
        })
    }, [selectedDate, cycles])

    // Fetch Logs for Selected Date
    const fetchDayLogs = async () => {
        if (!auth.currentUser) return
        const dateKey = format(selectedDate, 'yyyy-MM-dd')

        // Reset logs temporarily while fetching (optional, but good for UI consistency)
        // setDayLogs(null) 

        try {
            const snap = await getDoc(doc(db, "users", auth.currentUser.uid, "wellness_logs", dateKey))
            const futureCheck = isAfter(selectedDate, new Date()) && !isSameDay(selectedDate, new Date())

            if (snap.exists()) {
                setDayLogs(snap.data())
            } else {
                setDayLogs(null)
                // AUTO-OPEN LOGIC
                // If user clicked, data is empty, and NOT future -> Open Modal
                if (isUserInteraction.current && !futureCheck && !existingCycle) {
                    setIsLogModalOpen(true)
                }
            }
        } catch (e) {
            console.error("Error fetching logs", e)
        } finally {
            isUserInteraction.current = false // Reset interaction flag
        }
    }

    useEffect(() => {
        fetchDayLogs()
    }, [selectedDate, user])

    // Calculate Phase for Selected Date
    useEffect(() => {
        if (user?.lastPeriodDate) {
            const lastPeriod = new Date(user.lastPeriodDate)
            const cycleLen = parseInt(user.cycleLength || "28")
            const periodLen = parseInt(user.periodDuration || "5")

            const diffTime = Math.abs(selectedDate.getTime() - lastPeriod.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            const currentDay = (diffDays % cycleLen) || 1

            let phase = "Follicular"
            let title = `Day ${currentDay} of Cycle`

            if (currentDay <= periodLen) {
                phase = "Menstruation"
                title = `Day ${currentDay} of Period`
            } else if (currentDay >= (cycleLen - 14) && currentDay <= (cycleLen - 12)) {
                phase = "Ovulation"
                title = "Ovulation Window"
            } else if (currentDay > (cycleLen - 12)) {
                phase = "Luteal"
            }

            setCycleDisplay({ title, phase })
        }
    }, [selectedDate, user])

    const handlePeriodAction = async () => {
        if (!auth.currentUser) return
        if (isSaving) return

        if (existingCycle) {
            // EDIT MODE
            setIsEditPeriodOpen(true)
        } else {
            // CREATE MODE
            setIsSaving(true)
            const dateKey = format(selectedDate, 'yyyy-MM-dd')
            try {
                await addDoc(collection(db, "users", auth.currentUser.uid, "cycles"), {
                    startDate: dateKey,
                    endDate: format(addDays(selectedDate, 4), 'yyyy-MM-dd'), // Default 5 days
                    type: 'period'
                })
                alert("Period started for this date!")
            } catch (e) {
                console.error("Error logging period", e)
            } finally {
                setIsSaving(false)
            }
        }
    }

    // Consolidated Period Days (History + Predicted)
    const allPeriodDays = useMemo(() => {
        // 1. Historical from subcollection
        const historicalDays: Date[] = []
        cycles.forEach((c: any) => {
            if (c.startDate && c.endDate) {
                const start = new Date(c.startDate)
                const end = new Date(c.endDate)
                // simple loop to add days
                let current = start
                while (current <= end) {
                    historicalDays.push(new Date(current))
                    current = addDays(current, 1)
                }
            }
        })

        // 2. Predicted (if user has basic data)
        const predictedDays: Date[] = []
        if (user?.lastPeriodDate && user?.cycleLength) {
            const lastPeriod = new Date(user.lastPeriodDate)
            const cycleLen = parseInt(user.cycleLength)
            const duration = parseInt(user.periodDuration || "5")

            // Predict next 3 months
            for (let i = 1; i <= 3; i++) {
                const start = addDays(lastPeriod, i * cycleLen)
                for (let d = 0; d < duration; d++) {
                    predictedDays.push(addDays(start, d))
                }
            }
        }

        return [...historicalDays, ...predictedDays]
    }, [cycles, user])


    return (
        <div className="w-full mb-8">
            {/* Green Header Section */}
            <div className="bg-[#2D6A4F] text-white rounded-[32px] p-6 pb-24 relative overflow-hidden shadow-2xl shadow-emerald-900/20">

                {/* Top Info */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Hey, {user?.name?.split(' ')[0] || "Friend"}</h1>
                        <p className="text-sm opacity-80">{format(selectedDate, "EEEE, MMM d")}</p>
                    </div>

                    {/* Calendar Toggle Button */}
                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white/30 transition-all text-white"
                    >
                        <CalendarIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Interactive Calendar Strip */}
                <CycleCalendarStrip
                    selectedDate={selectedDate}
                    onSelectDate={handleDateSelect}
                    periodDays={allPeriodDays}
                />

                {/* Cycle Insights Mini-Card (New) */}
                <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 min-w-[120px] border border-white/10">
                        <p className="text-[10px] uppercase font-bold opacity-70">Cycle Status</p>
                        <p className="text-sm font-semibold">{user?.periodRegularity || "Regular"}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 min-w-[120px] border border-white/10">
                        <p className="text-[10px] uppercase font-bold opacity-70">Next Period</p>
                        <p className="text-sm font-semibold">
                            {user?.cycleLength ? `In ~${parseInt(user.cycleLength) - (parseInt(cycleDisplay.title.match(/\d+/)?.[0] || "0"))} Days` : "--"}
                        </p>
                    </div>
                </div>

            </div>

            {/* Floating Main Card (Daily Detail) */}
            <div className="mx-4 -mt-20 relative z-10">
                <div className="bg-white rounded-[24px] p-6 shadow-xl border border-gray-100 text-center min-h-[200px] flex flex-col justify-center">

                    {isFuture ? (
                        <div className="text-gray-400 py-8">
                            <p>Cannot log data for future dates.</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{cycleDisplay.phase} PHASE</span>
                            <h2 className="text-3xl font-bold text-[#1B4332] mt-2 mb-6">{cycleDisplay.title}</h2>

                            {/* CONDITONAL DISPLAY: Data vs Options */}
                            {dayLogs ? (
                                <>
                                    {/* Data Exists View */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Mood</span>
                                            <span className="text-lg font-bold text-[#2D6A4F] capitalize">{dayLogs?.mood || "--"}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <span className="block text-xs text-gray-400 uppercase font-bold mb-1">Symptoms</span>
                                            <span className="text-sm font-medium text-gray-700 truncate">
                                                {dayLogs?.symptoms?.length > 0 ? dayLogs.symptoms.join(", ") : "None"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-default">
                                            <Activity className="w-4 h-4" /> Details Logged
                                        </button>
                                        <button onClick={() => setIsLogModalOpen(true)} className="p-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200">
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* Empty State View - Action Buttons */
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-400 mb-4">No data logged for this day.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={handlePeriodAction}
                                            className={`${existingCycle ? 'bg-pink-100 text-pink-700' : 'bg-pink-500 text-white'} hover:opacity-90 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-lg active:scale-95`}
                                            disabled={isSaving}
                                        >
                                            <Droplets className={`w-6 h-6 ${existingCycle ? 'text-pink-600' : 'text-white'}`} />
                                            <span className="font-bold text-sm">
                                                {isSaving ? "Saving..." : (existingCycle ? "Edit Period" : "Log Period")}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setIsLogModalOpen(true)}
                                            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white p-4 rounded-2xl flex flex-col items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                        >
                                            <Plus className="w-6 h-6" />
                                            <span className="font-bold text-sm">Log Symptoms</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Month Modal */}
            <MonthCalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                onSelectDate={handleDateSelect}
                selectedDate={selectedDate}
                periodDays={allPeriodDays}
            />

            {/* Daily Log Modal */}
            <DailyLogModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                date={selectedDate}
                currentData={dayLogs}
                onSave={fetchDayLogs}
            />

            {/* Edit Period Modal */}
            <EditPeriodModal
                isOpen={isEditPeriodOpen}
                onClose={() => setIsEditPeriodOpen(false)}
                cycle={existingCycle}
            />

        </div>
    )
}
