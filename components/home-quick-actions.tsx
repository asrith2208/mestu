import { PlusCircle, ClipboardList, Stethoscope, BookOpen } from "lucide-react"

interface HomeQuickActionsProps {
  onNavigate: (page: string) => void
  onLogSymptoms: () => void
}

export default function HomeQuickActions({ onNavigate, onLogSymptoms }: HomeQuickActionsProps) {
  const actions = [
    { id: "period-tracker", label: "Log Period", icon: PlusCircle, color: "text-primary border-primary/20 hover:bg-primary/5" },
    { id: "symptoms", label: "Log Symptoms", icon: ClipboardList, color: "text-accent-warm border-accent-warm/20 hover:bg-accent-warm/5" },
    { id: "consultation", label: "Book Doctor", icon: Stethoscope, color: "text-accent-purple border-accent-purple/20 hover:bg-accent-purple/5" },
    { id: "content", label: "Learn More", icon: BookOpen, color: "text-emerald-600 border-emerald-600/20 hover:bg-emerald-600/5" },
  ]

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={() => action.id === "symptoms" ? onLogSymptoms() : onNavigate(action.id)}
              className={`group relative flex items-center p-4 rounded-2xl border transition-all duration-300 active:scale-95 hover:shadow-md bg-white ${action.color}`}
            >
              <div className="bg-gray-50 p-3 rounded-full mr-3 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-foreground">{action.label}</span>
                <span className="text-[10px] text-muted-foreground font-medium">Tap to open</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
