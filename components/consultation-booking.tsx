"use client"

import { useState } from "react"
import { collection, addDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

interface ConsultationBookingProps {
  onBookingComplete: (consultation: any) => void
  user: any
}

export default function ConsultationBooking({ onBookingComplete, user }: ConsultationBookingProps) {
  const [formData, setFormData] = useState({
    doctorName: "",
    doctorSpecialty: "",
    consultationType: "video",
    date: "",
    time: "",
    reason: "",
    notes: "",
  })

  const [submitted, setSubmitted] = useState(false)

  const doctors = [
    { name: "Dr. Priya Sharma", specialty: "General Gynecology", experience: "12 years" },
    { name: "Dr. Anjali Patel", specialty: "Reproductive Health", experience: "8 years" },
    { name: "Dr. Meera Singh", specialty: "PCOS Specialist", experience: "10 years" },
    { name: "Dr. Kavya Desai", specialty: "Endometriosis Expert", experience: "9 years" },
    { name: "Dr. Neha Gupta", specialty: "Fertility Specialist", experience: "11 years" },
  ]

  const reasons = [
    "General checkup",
    "Period irregularities",
    "PCOS consultation",
    "Endometriosis concerns",
    "Fertility planning",
    "Contraception advice",
    "Symptom management",
    "Other",
  ]

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }



  const handleSubmit = async (e: any) => {
    e.preventDefault()

    if (!formData.doctorName || !formData.date || !formData.time || !formData.reason) {
      alert("Please fill in all required fields")
      return
    }

    if (!auth.currentUser) {
      alert("You must be logged in to book.")
      return
    }

    try {
      const consultation = {
        ...formData,
        bookedDate: new Date().toISOString(),
        status: "pending", // Default to pending until "confirmed" by doctor (simulated)
        userId: auth.currentUser.uid
      }

      const docRef = await addDoc(collection(db, "users", auth.currentUser.uid, "consultations"), consultation)

      // Pass with ID
      onBookingComplete({ id: docRef.id, ...consultation })

      setSubmitted(true)
      setTimeout(() => {
        setFormData({
          doctorName: "",
          doctorSpecialty: "",
          consultationType: "video",
          date: "",
          time: "",
          reason: "",
          notes: "",
        })
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error("Error booking consultation:", error)
      alert("Failed to book consultation. Please try again.")
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Consultation Booked!</h3>
        <p className="text-muted-foreground mb-4">
          Your consultation with {formData.doctorName} has been confirmed for {formData.date} at {formData.time}
        </p>
        <p className="text-sm text-muted-foreground">You will receive a confirmation email shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Select Doctor <span className="text-accent-warm">*</span>
          </label>
          <select
            name="doctorName"
            value={formData.doctorName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Choose a doctor...</option>
            {doctors.map((doc) => (
              <option key={doc.name} value={doc.name}>
                {doc.name} - {doc.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Consultation Type */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Consultation Type</label>
          <select
            name="consultationType"
            value={formData.consultationType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="video">Video Call</option>
            <option value="phone">Phone Call</option>
            <option value="in-person">In-Person</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Preferred Date <span className="text-accent-warm">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Preferred Time <span className="text-accent-warm">*</span>
          </label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Reason for Consultation */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Reason for Consultation <span className="text-accent-warm">*</span>
        </label>
        <select
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select a reason...</option>
          {reasons.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Additional Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Share any additional information or concerns..."
          rows={4}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* Info Box */}
      <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
        <p className="text-sm text-foreground">
          <strong>📌 Note:</strong> This is a booking request. The doctor will confirm your appointment within 24 hours.
          You'll receive a confirmation email with meeting details.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-smooth"
      >
        Request Consultation
      </button>
    </form>
  )
}
