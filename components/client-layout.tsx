"use client"

import { useState, useEffect } from "react"
import { AuthProvider } from "@/components/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { SplashScreen } from "@/components/splash-screen"
import { LanguageProvider } from "@/components/language-context"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)

    // Explicitly mount to avoid hydration mismatch if possible, 
    // though splash screen covers it.
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <>
            {loading ? (
                <SplashScreen onComplete={() => setLoading(false)} />
            ) : (
                <LanguageProvider>
                    <AuthProvider>
                        {children}
                        <Toaster />
                    </AuthProvider>
                </LanguageProvider>
            )}
        </>
    )
}
