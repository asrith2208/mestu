"use client"

import { MapPin, Star, Phone, Globe, Award } from "lucide-react"

const DOCTORS = [
  {
    id: 1,
    name: "Dr. Anjali Sharma",
    specialty: "Gynecologist & Obstetrician",
    experience: "15+ Years",
    rating: 4.8,
    location: "Mumbai, Maharashtra",
    languages: ["English", "Hindi", "Marathi"],
    image: "👩‍⚕️",
    tags: ["PCOS Specialist", "High Risk Pregnancy"]
  },
  {
    id: 2,
    name: "Dr. Priya Desai",
    specialty: "Reproductive Endocrinologist",
    experience: "12+ Years",
    rating: 4.9,
    location: "Bangalore, Karnataka",
    languages: ["English", "Kannada", "Hindi"],
    image: "👩‍⚕️",
    tags: ["Infertility", "Endometriosis"]
  },
  {
    id: 3,
    name: "Dr. Rajesh Kumar",
    specialty: "Ayurvedic Practitioner",
    experience: "20+ Years",
    rating: 4.7,
    location: "Delhi, NCR",
    languages: ["English", "Hindi"],
    image: "👨‍⚕️",
    tags: ["Holistic Health", "Menstrual Disorders"]
  }
]

const AYURVEDA_TIPS = [
  {
    title: "Ashoka Tree Bark (Saraca asoca)",
    benefit: "Known as a 'friend of women', it helps manage heavy bleeding and pain.",
    usage: "Consult an Ayurvedic doctor for dosage (usually decoction/powder)."
  },
  {
    title: "Shatavari (Asparagus racemosus)",
    benefit: "Rejuvenating herb that balances hormones and supports reproductive health.",
    usage: "Often taken with milk or warm water."
  },
  {
    title: "Ginger & Jaggery Tea",
    benefit: "Helps induce periods and relieve cramps due to its warming nature.",
    usage: "Drink warm tea during the first few days of the cycle."
  }
]

export default function DoctorDirectory() {
  return (
    <div className="space-y-8">
      {/* Doctor Listings */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Find a Specialist</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DOCTORS.map((doctor) => (
            <div key={doctor.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl">
                  {doctor.image}
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg text-yellow-700 text-sm font-bold">
                  <Star className="w-4 h-4 fill-current" /> {doctor.rating}
                </div>
              </div>

              <h4 className="text-lg font-bold text-gray-900 mb-1">{doctor.name}</h4>
              <p className="text-blue-600 font-medium text-sm mb-3">{doctor.specialty}</p>

              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" /> {doctor.experience}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {doctor.location}
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> {doctor.languages.join(", ")}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {doctor.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Book Visit
                </button>
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ayurvedic Wisdom */}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-2">
          🍃 Ayurvedic Wisdom for Menstrual Health
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          {AYURVEDA_TIPS.map((tip, i) => (
            <div key={i} className="bg-white/80 p-5 rounded-xl border border-green-100">
              <h4 className="font-bold text-green-900 mb-2">{tip.title}</h4>
              <p className="text-sm text-green-800 mb-3">{tip.benefit}</p>
              <p className="text-xs text-green-600 font-medium bg-green-100/50 p-2 rounded">
                Usage: {tip.usage}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-green-600 mt-6 text-center italic">
          Disclaimer: Ayurvedic remedies should be taken under the guidance of a qualified practitioner.
        </p>
      </div>
    </div>
  )
}
