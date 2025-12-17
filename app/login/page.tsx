"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-context"
import { Loader2, Phone } from 'lucide-react'
import { toast } from "sonner"

export default function LoginPage() {
    const [countryCode, setCountryCode] = useState("+91")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [otp, setOtp] = useState("")
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<"PHONE" | "OTP">("PHONE")
    const { user } = useAuth()
    const router = useRouter()

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
            router.push("/")
        }
    }, [user, router])

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
                callback: () => {
                    // reCAPTCHA solved
                },
            })
        }
    }, [])

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
            router.push("/")
        } catch (error) {
            console.error(error)
            toast.error("Invalid OTP. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <Card className="w-[380px] shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                        <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Welcome Back</CardTitle>
                    <CardDescription>Enter your phone number to sign in</CardDescription>
                </CardHeader>
                <CardContent>
                    <div id="recaptcha-container"></div>
                    {step === "PHONE" ? (
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
