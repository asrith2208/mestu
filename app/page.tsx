"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import Dashboard from "@/components/dashboard"
import PeriodTracker from "@/components/period-tracker"
import SymptomTracker from "@/components/symptom-tracker"
import HealthTools from "@/components/health-tools"
import ContentHub from "@/components/content-hub"
import Community from "@/components/community"
import Profile from "@/components/profile"
import GynecologistConsultation from "@/components/gynecologist-consultation"
import OnboardingFlow from "@/components/onboarding-flow"
import BottomNavigation from "@/components/bottom-navigation"
import HomePage from "@/components/home-page"

export default function Home() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!authUser) {
      router.push("/login")
      return
    }

    try {
      const savedUser = localStorage.getItem("saukhya_user")
      // We don't need onboardingComplete check if we just check user data existence
      // const onboardingComplete = localStorage.getItem("saukhya_onboarding_complete")

      if (savedUser) {
        setUser(JSON.parse(savedUser))
        setShowOnboarding(false)
      } else {
        setShowOnboarding(true)
      }
    } catch (error) {
      console.log("[v0] localStorage access error:", error)
      setShowOnboarding(true)
    } finally {
      setIsLoading(false)
    }
  }, [authUser, authLoading, router])

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={(userData) => {
          setUser(userData)
          setShowOnboarding(false)
          setCurrentPage("dashboard")
        }}
      />
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <HomePage user={user} onNavigate={setCurrentPage} />
      case "period-tracker":
        return <PeriodTracker user={user} />
      case "symptoms":
        return <SymptomTracker user={user} />
      case "health-tools":
        return <HealthTools user={user} />
      case "consultation":
        return <GynecologistConsultation user={user} />
      case "content":
        return <ContentHub user={user} />
      case "community":
        return <Community user={user} />
      case "profile":
        return <Profile user={user} setUser={setUser} />
      default:
        return <Dashboard user={user} />
    }
  }

  if (authLoading || (isLoading && authUser)) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Saukhya...</p>
        </div>
      </main>
    )
  }

  if (!authUser) return null

  return (
    <main className="min-h-screen bg-background">
      <div className="pb-20 safe-area-inset-bottom">{renderPage()}</div>
      <BottomNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </main>
  )
}
