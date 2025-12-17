import { Home, HeartPulse, Stethoscope, Users, User } from "lucide-react"

interface BottomNavigationProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

export default function BottomNavigation({ currentPage, setCurrentPage }: BottomNavigationProps) {
  const navItems = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "health-tools", label: "Health", icon: HeartPulse },
    { id: "consultation", label: "Consult", icon: Stethoscope },
    { id: "community", label: "Community", icon: Users },
    { id: "profile", label: "Profile", icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-inset-bottom pointer-events-none">
      <div className="mx-auto max-w-md pointer-events-auto">
        <div className="flex justify-around items-center bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 rounded-2xl h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? "text-primary -translate-y-1" : "text-muted-foreground hover:text-primary/70"
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? "bg-primary/10" : "bg-transparent"}`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? "opacity-100 font-bold" : "opacity-0 h-0 overflow-hidden"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
