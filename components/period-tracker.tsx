"use client"

import type React from "react"

import { useState, useEffect } from "react"
import CalendarView from "./calendar-view"
import CycleInsights from "./cycle-insights"

interface PeriodTrackerProps {
  user: any
}

import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useLanguage } from "./language-context"

// ... imports

export default function PeriodTracker({ user }: PeriodTrackerProps) {
  const [cycles, setCycles] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [editingId, setEditingId] = useState<string | null>(null) // Changed to string for Firestore IDs
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    flowIntensity: "moderate",
    notes: "",
  })

  useEffect(() => {
    const fetchCycles = async () => {
      if (!auth.currentUser) return
      try {
        const cyclesRef = collection(db, "users", auth.currentUser.uid, "cycles")
        const q = query(cyclesRef, orderBy("startDate", "desc"))
        const querySnapshot = await getDocs(q)
        const fetchedCycles = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setCycles(fetchedCycles)
      } catch (error) {
        console.error("Error fetching cycles:", error)
      }
    }
    fetchCycles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser) return

    try {
      if (editingId) {
        // editingId is likely a string now (doc ID), but let's check since we used Date.now() before
        // If it's a new migration, old IDs might be numbers, new ones strings.
        // For simplicity in this "new" app, we assume we are creating new real data mostly.
        // If editingId is present, we update.
        const cycleRef = doc(db, "users", auth.currentUser.uid, "cycles", editingId.toString())
        await updateDoc(cycleRef, formData)

        setCycles(cycles.map((cycle) => (cycle.id === editingId ? { ...cycle, ...formData } : cycle)))
        setEditingId(null)
      } else {
        const newCycleData = {
          ...formData,
          createdAt: new Date().toISOString()
        }
        const docRef = await addDoc(collection(db, "users", auth.currentUser.uid, "cycles"), newCycleData)
        const newCycle = { id: docRef.id, ...newCycleData }
        setCycles([newCycle, ...cycles])
      }
    } catch (error) {
      console.error("Error saving cycle:", error)
      alert("Failed to save cycle")
    }

    setFormData({ startDate: "", endDate: "", flowIntensity: "moderate", notes: "" })
    setShowForm(false)
  }

  const handleDelete = async (id: any) => {
    if (!auth.currentUser) return
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "cycles", id.toString()))
      setCycles(cycles.filter((cycle) => cycle.id !== id))
    } catch (error) {
      console.error("Error deleting cycle:", error)
    }
  }

  const handleEdit = (cycle: any) => {
    setFormData({
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      flowIntensity: cycle.flowIntensity,
      notes: cycle.notes,
    })
    setEditingId(cycle.id)
    setShowForm(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Period Tracker</h2>
        <p className="text-muted-foreground">Track your menstrual cycle and patterns</p>
      </div>

      {cycles.length > 0 && (
        <div className="mb-8">
          <CycleInsights cycles={cycles} />
        </div>
      )}

      {cycles.length > 0 && (
        <div className="mb-8">
          <CalendarView cycles={cycles} currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
        </div>
      )}

      {/* Add Period Button */}
      <button
        onClick={() => {
          setShowForm(!showForm)
          setEditingId(null)
          setFormData({ startDate: "", endDate: "", flowIntensity: "moderate", notes: "" })
        }}
        className="mb-6 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-smooth"
      >
        {showForm ? "Cancel" : "+ Log Period"}
      </button>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-border rounded-lg p-6 mb-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Period Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Period End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Flow Intensity</label>
              <select
                value={formData.flowIntensity}
                onChange={(e) => setFormData({ ...formData, flowIntensity: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
                <option value="very-heavy">Very Heavy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-smooth"
            >
              {editingId ? "Update Period" : "Save Period"}
            </button>
          </form>
        </div>
      )}

      {/* Cycles List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">Your Cycles</h3>
        {cycles.length === 0 ? (
          <div className="bg-muted border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No cycles logged yet. Start tracking to see your patterns!</p>
          </div>
        ) : (
          Array.from(new Map(cycles.map(cycle => [cycle.startDate, cycle])).values())
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .map((cycle) => (
              <div key={cycle.id} className="bg-white border border-border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{new Date(cycle.startDate).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">
                      Duration:{" "}
                      {cycle.endDate
                        ? Math.ceil(
                          (new Date(cycle.endDate).getTime() - new Date(cycle.startDate).getTime()) /
                          (1000 * 60 * 60 * 24),
                        ) + 1
                        : "ongoing"}{" "}
                      days
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Flow: <span className="capitalize">{cycle.flowIntensity}</span>
                    </p>
                    {cycle.notes && <p className="text-sm text-muted-foreground mt-2">{cycle.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cycle)}
                      className="px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-smooth text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cycle.id)}
                      className="px-3 py-2 bg-accent-red/10 text-accent-red rounded-lg hover:bg-accent-red/20 transition-smooth text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
