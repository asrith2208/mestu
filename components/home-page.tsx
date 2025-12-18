"use client"

interface HomePageProps {
  user: any
  onNavigate: (page: string) => void
}

import { useState } from "react"
import HomeQuickActions from "./home-quick-actions"
import HomeInsights from "./home-insights"
import HomeHeroSection from "./home-hero-section"
import DailyLogModal from "./daily-log-modal"

export default function HomePage({ user, onNavigate }: HomePageProps) {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  return (
    <div className="max-w-md mx-auto pb-28 bg-gray-50/50 min-h-screen">

      {/* New Hero Section */}
      <HomeHeroSection
        user={user}
        isLogModalOpen={isLogModalOpen}
        setIsLogModalOpen={setIsLogModalOpen}
      />

      <div className="px-4">
        {/* Insights */}
        <HomeInsights user={user} />

        {/* Quick Actions */}
        <HomeQuickActions
          onNavigate={onNavigate}
          onLogSymptoms={() => setIsLogModalOpen(true)}
        />
      </div>

      {/* Daily Log Modal (Global for Home) */}
      {/* Note: HomeHeroSection ALSO renders it, need to remove it from there or control it from here. 
           Decided: Move it here to keep HomePage clean or keep it in Hero? 
           Actually, Hero needs it for data/date context. 
           Better: Pass setIsLogModalOpen to Hero, and ONLY render Modal in Hero?
           OR: Render modal here and pass selectedDate?
           Hero manages selectedDate. 
           Result: Pass isLogModalOpen/setIsLogModalOpen to Hero. Hero renders modal.
           QuickActions triggers the state change in Home, which flows down to Hero.
       */}
    </div>
  )
}
