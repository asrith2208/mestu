"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
    const [isPresent, setIsPresent] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsPresent(false)
            setTimeout(onComplete, 500) // Wait for exit animation
        }, 2500)

        return () => clearTimeout(timer)
    }, [onComplete])

    const text = "Saukhya"
    const letters = text.split("")

    return (
        <AnimatePresence>
            {isPresent && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="relative flex overflow-hidden">
                        {letters.map((letter, index) => (
                            <motion.span
                                key={index}
                                initial={{
                                    opacity: 0,
                                    x: Math.random() * 800 - 400,
                                    y: Math.random() * 800 - 400,
                                    rotate: Math.random() * 360,
                                    scale: 0.5,
                                }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                    y: 0,
                                    rotate: 0,
                                    scale: 1,
                                }}
                                transition={{
                                    type: "spring",
                                    damping: 12,
                                    stiffness: 100,
                                    delay: index * 0.1,
                                    duration: 1.5,
                                }}
                                className="text-6xl font-bold text-green-700 md:text-8xl"
                            >
                                {letter}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
