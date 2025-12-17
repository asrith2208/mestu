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
    const [phoneNumber, setPhoneNumber] = useState("")
    const [otp, setOtp] = useState("")
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<"PHONE" | "OTP">("PHONE")
    const { user } = useAuth()
    const router = useRouter()

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
            const appVerifier = window.recaptchaVerifier
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
            setConfirmationResult(confirmation)
            setStep("OTP")
            toast.success("OTP sent successfully!")
        } catch (error) {
            console.error(error)
            toast.error("Failed to send OTP. Please check the number and try again.")
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
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Sign in with your phone number</CardDescription>
                </CardHeader>
                <CardContent>
                    <div id="recaptcha-container"></div>
                    {step === "PHONE" ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="tel"
                                    placeholder="+1 234 567 8900"
                                    value={phoneNumber}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleSendOtp} disabled={loading || !phoneNumber}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send OTP
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="text"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleVerifyOtp} disabled={loading || !otp}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify OTP
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => setStep("PHONE")}
                                disabled={loading}
                            >
                                Back to Phone Number
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
