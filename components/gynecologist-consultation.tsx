"use client"

import { useState, useEffect } from "react"
import ConsultationBooking from "./consultation-booking"
import ConsultationHistory from "./consultation-history"
import DoctorDirectory from "./doctor-directory"

interface GynecologistConsultationProps {
  user: any
}

import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

export default function GynecologistConsultation({ user }: GynecologistConsultationProps) {
  const [activeTab, setActiveTab] = useState("book")
  const [consultations, setConsultations] = useState<any[]>([])

  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(collection(db, "users", auth.currentUser.uid, "consultations"), orderBy("bookedDate", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setConsultations(fetched)
    }, (error) => {
      console.log("Error loading consultations:", error)
    })

    return () => unsubscribe()
  }, [])

  const handleBookingComplete = (newConsultation: any) => {
    // No need to manually update state, onSnapshot will handle it
    setActiveTab("history")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">👨‍⚕️ Gynecologist Consultation</h2>
        <p className="text-muted-foreground">Connect with qualified gynecologists for professional guidance</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("book")}
          className={`px-4 py-3 font-semibold whitespace-nowrap transition-smooth border-b-2 ${activeTab === "book"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          📅 Book Consultation
        </button>
        <button
          onClick={() => setActiveTab("doctors")}
          className={`px-4 py-3 font-semibold whitespace-nowrap transition-smooth border-b-2 ${activeTab === "doctors"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          👩‍⚕️ Find Doctors
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-3 font-semibold whitespace-nowrap transition-smooth border-b-2 ${activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          📋 My Consultations ({consultations.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        {activeTab === "book" && <ConsultationBooking onBookingComplete={handleBookingComplete} user={user} />}
        {activeTab === "doctors" && <DoctorDirectory />}
        {activeTab === "history" && <ConsultationHistory consultations={consultations} />}
      </div>
    </div>
  )
}
