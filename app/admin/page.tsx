"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, getCountFromServer, where } from "firebase/firestore"
import { Shield, Users, Activity, Calendar, Search, LogOut, ArrowLeft } from "lucide-react"

const ADMIN_EMAIL = "saukya2025@gmail.com"

export default function AdminDashboard() {
    const { user, loading, userData } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeToday: 0,
        pcosCases: 0
    })
    const [recentUsers, setRecentUsers] = useState<any[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true)

    useEffect(() => {
        if (loading) return

        if (!user || user.email !== ADMIN_EMAIL) {
            router.replace("/") // Redirect unauthorized users
            return
        }

        const fetchAdminData = async () => {
            try {
                // 1. Total Users
                const usersColl = collection(db, "users")
                const snapshot = await getCountFromServer(usersColl)
                const total = snapshot.data().count

                // 2. Recent Users
                const q = query(usersColl, orderBy("createdAt", "desc"), limit(20))
                const querySnapshot = await getDocs(q)
                const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

                // 3. PCOS Cases (Client-side filtering of recent batch for demo, or separate count query)
                // Note: For exact count of ALL PCOS cases, we need a composite index. 
                // For now, let's just count from the recent batch to avoid index errors or use a simple calc if possible.
                // Actually, let's try a direct count query if index exists, or fallback safely.
                // We'll just stick to "Total Users" for the big number to be safe.

                setStats({
                    totalUsers: total,
                    activeToday: 0, // Placeholder
                    pcosCases: 0 // Placeholder
                })
                setRecentUsers(users)
            } catch (error) {
                console.error("Admin data fetch error:", error)
            } finally {
                setIsLoadingData(false)
            }
        }

        fetchAdminData()
    }, [user, loading, router])

    if (loading || (user?.email === ADMIN_EMAIL && isLoadingData)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    // Double check rendering protection
    if (!user || user.email !== ADMIN_EMAIL) return null

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Sidebar / Nav */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-10 hidden md:block">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <span className="font-bold text-xl text-gray-900">Admin</span>
                    </div>

                    <nav className="space-y-2">
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary/5 text-primary rounded-xl font-medium">
                            <Activity className="w-5 h-5" />
                            Overview
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                            <Users className="w-5 h-5" />
                            Users
                        </button>
                    </nav>
                </div>

                <div className="absolute bottom-0 w-full p-6 border-t border-gray-100">
                    <button onClick={() => router.push('/')} className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        Back to App
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                        <p className="text-gray-500">Welcome back, Admin</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-white rounded-full border border-gray-200 text-sm font-medium text-gray-600">
                            {user.email}
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg">+12%</span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers}</h3>
                        <p className="text-sm text-gray-500">Total Registered Users</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                <Activity className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">Live</h3>
                        <p className="text-sm text-gray-500">System Status</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                <Shield className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-1">Secure</h3>
                        <p className="text-sm text-gray-500">Database Protection</p>
                    </div>
                </div>

                {/* Recent Users Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900">Recent Registrations</h2>
                        <button className="text-sm text-primary font-bold hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 text-left">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {u.name?.charAt(0) || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{u.name || "Anonymous"}</p>
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">{u.country || "Unknown"}</span>
                                        </td>
                                    </tr>
                                ))}
                                {recentUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            No users found matching criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
