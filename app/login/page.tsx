"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-context"
import { Loader2, Phone, Shield } from 'lucide-react'
import { toast } from "sonner"

export default function LoginPage() {
    // Phone Auth State
    const [countryCode, setCountryCode] = useState("+91")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [otp, setOtp] = useState("")
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
    const [step, setStep] = useState<"PHONE" | "OTP">("PHONE")

    // Admin Auth State
    const [isAdminMode, setIsAdminMode] = useState(false)
    const [adminEmail, setAdminEmail] = useState("")
    const [adminPassword, setAdminPassword] = useState("")

    const [loading, setLoading] = useState(false)
    const { user } = useAuth()
    const router = useRouter()

    // Check for admin query param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get("admin") === "true") {
            setIsAdminMode(true)
        }
    }, [])

    const countries = [
        { code: "+91", label: "India 🇮🇳" },
        { code: "+1", label: "USA/Canada 🇺🇸/🇨🇦" },
        { code: "+49", label: "Germany 🇩🇪" },
        { code: "+44", label: "UK 🇬🇧" },
        { code: "+61", label: "Australia 🇦🇺" },
        { code: "+971", label: "UAE 🇦🇪" },
    ]

    useEffect(() => {
        if (user) {
            if (isAdminMode) {
                // Only redirect to admin dashboard if we are ALREADY the admin
                if (user.email === "saukya2025@gmail.com") {
                    router.push("/admin")
                }
                // If logged in as regular user but trying to access admin login, 
                // do NOT redirect. Let them see the form to switch accounts.
            } else {
                // Normal user flow: if logged in, go home
                router.push("/")
            }
        }
    }, [user, router, isAdminMode])

    useEffect(() => {
        if (!isAdminMode && !window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
                callback: () => {
                    // reCAPTCHA solved
                },
            })
        }
    }, [isAdminMode])

    const handleSendOtp = async () => {
        setLoading(true)
        try {
            const formattedNumber = `${countryCode}${phoneNumber}`
            const appVerifier = window.recaptchaVerifier
            const confirmation = await signInWithPhoneNumber(auth, formattedNumber, appVerifier)
            setConfirmationResult(confirmation)
            setStep("OTP")
            toast.success(`OTP sent to ${formattedNumber}`)
        } catch (error: any) {
            console.error(error)
            let msg = "Failed to send OTP."
            if (error.code === "auth/invalid-phone-number") msg = "Invalid phone number format."
            if (error.code === "auth/quota-exceeded") msg = "SMS quota exceeded."
            if (error.code === "auth/too-many-requests") msg = "Too many requests. Try again later."
            if (error.code === "auth/invalid-app-credential" || error.code === "auth/missing-client-identifier") {
                msg = "Development Error: Please use a Test Phone Number (set in Firebase Console) for localhost."
            }

            toast.error(msg)
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear()
                window.recaptchaVerifier = null
            }
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (!confirmationResult) return
        setLoading(true)
        try {
            await confirmationResult.confirm(otp)
            toast.success("Successfully logged in!")
            // Route happens in useEffect
        } catch (error) {
            console.error(error)
            toast.error("Invalid OTP. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleAdminLogin = async () => {
        if (!adminEmail || !adminPassword) {
            toast.error("Please enter email and password")
            return
        }
        setLoading(true)
        try {
            const { signInWithEmailAndPassword } = await import("firebase/auth")
            await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
            toast.success("Admin access granted")
            router.push("/admin")
        } catch (error: any) {
            console.error("Admin login error", error)
            toast.error("Invalid credentials")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <Card className="w-[380px] shadow-lg">
                <CardHeader className="text-center">
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isAdminMode ? 'bg-red-50' : 'bg-primary/10'}`}>
                        {isAdminMode ? <Shield className="w-6 h-6 text-red-600" /> : <Phone className="w-6 h-6 text-primary" />}
                    </div>
                    <CardTitle className="text-xl">{isAdminMode ? "Admin Access" : "Welcome Back"}</CardTitle>
                    <CardDescription>
                        {isAdminMode ? "Restricted Area. Authorized Personnel Only." : "Enter your phone number to sign in"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isAdminMode && <div id="recaptcha-container"></div>}

                    {isAdminMode ? (
                        /* Admin Email/Password Form */
                        <div className="space-y-4">
                            <Input
                                type="email"
                                placeholder="Admin Email"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                            />
                            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleAdminLogin} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Authenticate
                            </Button>
                            <Button variant="ghost" className="w-full text-xs text-gray-400" onClick={() => setIsAdminMode(false)}>
                                Back to App
                            </Button>
                        </div>
                    ) : (
                        /* Standard Phone Auth Form */
                        step === "PHONE" ? (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <select
                                        className="flex h-10 w-[110px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                    >
                                        {countries.map(c => (
                                            <option key={c.code} value={c.code}>{c.label} {c.code}</option>
                                        ))}
                                    </select>
                                    <Input
                                        type="tel"
                                        placeholder="Phone Number"
                                        value={phoneNumber}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                                <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleSendOtp} disabled={loading || !phoneNumber}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send OTP
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    Standard SMS rates may apply.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-center text-sm">
                                        <span className="text-muted-foreground">Sent to </span>
                                        <span className="font-semibold">{countryCode} {phoneNumber}</span>
                                    </div>
                                    <Input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                                        className="text-center text-lg tracking-widest"
                                        maxLength={6}
                                    />
                                </div>
                                <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleVerifyOtp} disabled={loading || !otp}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Verify OTP
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => setStep("PHONE")}
                                    disabled={loading}
                                >
                                    Change Phone Number
                                </Button>
                            </div>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
declare global {
    interface Window {
        recaptchaVerifier: any
    }
}
