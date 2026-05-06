import { Music } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center">
          <Music className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-navy/30 animate-ping" />
      </div>
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}
