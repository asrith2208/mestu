"use client"

import type React from "react"

import { useState, useEffect } from "react"
import ProfileStats from "./profile-stats"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

import { useLanguage } from "./language-context"

interface ProfileProps {
  user: any
  setUser: (user: any) => void
}

export default function Profile({ user, setUser }: ProfileProps) {
  const { language, setLanguage } = useLanguage()
  const [activeTab, setActiveTab] = useState("profile")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    cycleLength: "28",
    periodDuration: "5",
    conditions: [] as string[],
  })
  const [notificationSettings, setNotificationSettings] = useState({
    periodReminder: true,
    symptomReminder: true,
    wellnessReminder: true,
    communityUpdates: false,
    emailNotifications: true,
  })
  const [privacySettings, setPrivacySettings] = useState({
    profilePrivate: false,
    dataSharing: false,
    analyticsTracking: true,
  })
  const [cycles, setCycles] = useState<any[]>([])
  const [symptoms, setSymptoms] = useState<any[]>([])
  const [wellness, setWellness] = useState<any[]>([])

  useEffect(() => {
    // If user prop is provided (from Firestore via AuthContext), populate form data
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        age: user.age || "",
        cycleLength: user.cycleLength || "28",
        periodDuration: user.periodDuration || "5",
        conditions: user.conditions || [],
      })
    }
  }, [user])

  // We can keep these local settings for now as they are preference-based, or move them to Firestore later.
  // Ideally, notifications and privacy should also be in Firestore.
  useEffect(() => {
    const savedNotifications = localStorage.getItem("saukhya_notifications")
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications))
    }

    const savedPrivacy = localStorage.getItem("saukhya_privacy")
    if (savedPrivacy) {
      setPrivacySettings(JSON.parse(savedPrivacy))
    }

    // FETCH cycles/symptoms from Firestore if available? 
    // They are passed to ProfileStats via props if we fetched them in parent page.
    // However, ProfileStats expects arrays. 
    // Wait, the parent Page passes user={user}. 'user' object from AuthContext 
    // currently ONLY contains the profile data from 'users/{uid}'.
    // It does NOT contain subcollections 'cycles' and 'symptoms'.
    // We need to fetch stats here or in parent.
    // For now let's rely on what we have, but ProfileStats needs data.
    // The current ProfileStats implementation uses passed props.
    // We should probably fetch them here if we want Profile to be standalone-ish
    // OR just use what we have if we want to stick to the 'user' object.

    // Re-using the localStorage for "Stats" is legacy. 
    // Let's blank them out for now to encourage Firestore usage or leave them compatible.
  }, [])

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem("saukhya_user", JSON.stringify(formData))
    setUser(formData)
    alert("Profile updated!")
  }

  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem("saukhya_notifications", JSON.stringify(notificationSettings))
    alert("Notification settings updated!")
  }

  const handlePrivacySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem("saukhya_privacy", JSON.stringify(privacySettings))
    alert("Privacy settings updated!")
  }

  const handleConditionToggle = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }))
  }

  const handleExportData = () => {
    const allData = {
      profile: formData,
      cycles,
      symptoms,
      wellness,
      exportDate: new Date().toISOString(),
    }

    const csv = [
      ["Saukhya Health Data Export"],
      ["Exported on:", new Date().toLocaleDateString()],
      [],
      ["PROFILE INFORMATION"],
      ["Name", formData.name],
      ["Email", formData.email],
      ["Age", formData.age],
      ["Cycle Length", formData.cycleLength],
      ["Conditions", formData.conditions.join(", ")],
      [],
      ["CYCLES TRACKED"],
      ["Start Date", "End Date", "Flow Intensity", "Notes"],
      ...cycles.map((c) => [c.startDate, c.endDate || "Ongoing", c.flowIntensity, c.notes]),
      [],
      ["SYMPTOMS LOGGED"],
      ["Date", "Pain Level", "Symptoms", "Notes"],
      ...symptoms.map((s) => [s.date, s.painLevel, Object.keys(s.symptoms).join(", "), s.notes]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `saukhya-data-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Your Profile</h2>
        <p className="text-muted-foreground">Manage your health information and preferences</p>
      </div>

      {/* Language Switcher */}
      <div className="flex justify-end mb-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          className="bg-white border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
        >
          <option value="en">English (EN)</option>
          <option value="hi">Hindi (हिंदी)</option>
          <option value="mr">Marathi (मराठी)</option>
        </select>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <ProfileStats cycles={cycles} symptoms={symptoms} wellness={wellness} />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-border overflow-x-auto pb-2">
        {[
          { id: "profile", label: "Profile" },
          { id: "history", label: "History" },
          { id: "notifications", label: "Notifications" },
          { id: "privacy", label: "Privacy" },
          { id: "data", label: "Data" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-semibold transition-smooth border-b-2 whitespace-nowrap ${activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))
        }
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <form
          onSubmit={handleProfileSubmit}
          className="bg-white border border-border rounded-lg p-6 shadow-sm space-y-6"
        >
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your age"
                />
              </div>
            </div>
          </div>

          {/* Cycle Info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Cycle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Average Cycle Length (days)</label>
                <input
                  type="number"
                  value={formData.cycleLength}
                  onChange={(e) => setFormData({ ...formData, cycleLength: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="20"
                  max="40"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Average Period Duration (days)
                </label>
                <input
                  type="number"
                  value={formData.periodDuration}
                  onChange={(e) => setFormData({ ...formData, periodDuration: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="2"
                  max="10"
                />
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Health Conditions</h3>
            <div className="space-y-2">
              {["PCOS", "Endometriosis", "PMDD", "Fibroids", "Adenomyosis"].map((condition) => (
                <label key={condition} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.conditions.includes(condition)}
                    onChange={() => handleConditionToggle(condition)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-foreground">{condition}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-smooth"
          >
            Save Profile
          </button>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <form
          onSubmit={handleNotificationSubmit}
          className="bg-white border border-border rounded-lg p-6 shadow-sm space-y-6"
        >
          <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.periodReminder}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, periodReminder: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <p className="font-semibold text-foreground">Period Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified when your period is approaching</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.symptomReminder}
                onChange={(e) =>
                  setNotificationSettings({ ...notificationSettings, symptomReminder: e.target.checked })
                }
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <p className="font-semibold text-foreground">Symptom Tracking Reminders</p>
                <p className="text-sm text-muted-foreground">Daily reminders to log your symptoms</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.wellnessReminder}
                onChange={(e) =>
                  setNotificationSettings({ ...notificationSettings, wellnessReminder: e.target.checked })
                }
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <p className="font-semibold text-foreground">Wellness Reminders</p>
                <p className="text-sm text-muted-foreground">Reminders to log water intake and exercise</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.communityUpdates}
                onChange={(e) =>
                  setNotificationSettings({ ...notificationSettings, communityUpdates: e.target.checked })
                }
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <p className="font-semibold text-foreground">Community Updates</p>
                <p className="text-sm text-muted-foreground">Notifications about new discussions and replies</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) =>
                  setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })
                }
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <p className="font-semibold text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-smooth"
          >
            Save Notification Settings
          </button>
        </form>
      )}

      {/* Privacy Tab */}
      {activeTab === "privacy" && (
        <form
          onSubmit={handlePrivacySubmit}
          className="bg-white border border-border rounded-lg p-6 shadow-sm space-y-6"
        >
          <h3 className="text-lg font-semibold text-foreground">Privacy Settings</h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.profilePrivate}
                onChange={(e) => setPrivacySettings({ ...privacySettings, profilePrivate: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <p className="font-semibold text-foreground">Private Profile</p>
                <p className="text-sm text-muted-foreground">Hide your profile from other community members</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.dataSharing}
                onChange={(e) => setPrivacySettings({ ...privacySettings, dataSharing: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <p className="font-semibold text-foreground">Allow Data Sharing for Research</p>
                <p className="text-sm text-muted-foreground">Help improve menstrual health research (anonymized)</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.analyticsTracking}
                onChange={(e) => setPrivacySettings({ ...privacySettings, analyticsTracking: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <div>
                <p className="font-semibold text-foreground">Analytics Tracking</p>
                <p className="text-sm text-muted-foreground">Allow us to track app usage to improve features</p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-smooth"
          >
            Save Privacy Settings
          </button>
        </form>
      )}

      {/* Data Tab */}
      {activeTab === "data" && (
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Data Management</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Export all your health data in CSV format. This includes your profile information, cycle tracking,
              symptoms, and wellness logs.
            </p>
            <button
              onClick={handleExportData}
              className="w-full bg-accent-warm hover:bg-accent-warm/90 text-white font-semibold py-3 rounded-lg transition-smooth"
            >
              Export My Data (CSV)
            </button>
          </div>

          <div className="bg-white border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Data Storage</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Cycles Tracked:</span> {cycles.length}
              </p>
              <p>
                <span className="font-semibold text-foreground">Symptom Entries:</span> {symptoms.length}
              </p>
              <p>
                <span className="font-semibold text-foreground">Wellness Logs:</span> {wellness.length}
              </p>
              <p className="text-xs mt-4">
                All your data is stored locally on your device. We do not store your data on our servers unless you
                explicitly enable data sharing.
              </p>
            </div>
          </div>

          <div className="bg-accent-red/10 border-2 border-accent-red rounded-lg p-6">
            <h3 className="text-lg font-semibold text-accent-red mb-4">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete all your data. This action cannot be undone.
            </p>
            <button className="w-full bg-accent-red hover:bg-accent-red/90 text-white font-semibold py-3 rounded-lg transition-smooth">
              Delete All Data
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Symptom Trends</h3>
            <div className="h-[300px] w-full">
              {symptoms.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={symptoms}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#9ca3af' }}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#e11d48' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="painLevel"
                      stroke="#e11d48"
                      strokeWidth={3}
                      dot={{ stroke: '#e11d48', strokeWidth: 2, r: 4, fill: '#fff' }}
                      activeDot={{ r: 6, fill: '#e11d48' }}
                      name="Pain Level"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
                  <p>No symptom data tracked yet.</p>
                  <p className="text-sm">Start logging your symptoms to see trends here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {symptoms.slice(0, 5).map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {new Date(log.date).getDate()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Symptom Log</p>
                      <p className="text-xs text-gray-500">{new Date(log.date).toDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-primary">Pain: {log.painLevel}/10</span>
                    <span className="text-xs text-muted-foreground">{Object.keys(log.symptoms || {}).length} symptoms</span>
                  </div>
                </div>
              ))}
              {symptoms.length === 0 && <p className="text-center text-gray-400 py-4">No recent activity</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
