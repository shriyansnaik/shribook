import { BrandMark, Wordmark } from '@/components/shared/Logo'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-5">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-3xl bg-navy/5 animate-ping" />
        <div className="relative w-20 h-20 rounded-3xl bg-white ring-1 ring-border shadow-card flex items-center justify-center">
          <BrandMark className="w-12 h-12 animate-brand-pulse" />
        </div>
      </div>
      <Wordmark className="text-lg" />
      <p className="text-xs text-muted-foreground -mt-2 tracking-wide">Loading…</p>
    </div>
  )
}
