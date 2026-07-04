import { cn } from '@/lib/utils'

/**
 * ShriBook brand assets.
 *
 * - <BrandMark />   the compact श्री glyph (public/shribook-mark.png)
 * - <Wordmark />    "ShriBook" set in the brand navy + green
 * - <BrandLockup /> mark + wordmark, for headers / nav
 * - <FullLogo />    the complete raster lockup (public/shribook-logo.png)
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/shribook-mark.png"
      alt="ShriBook"
      className={cn('object-contain select-none', className)}
      draggable={false}
    />
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-bold tracking-tight leading-none', className)}>
      <span className="text-navy">Shri</span>
      <span className="text-green">Book</span>
    </span>
  )
}

interface BrandLockupProps {
  className?: string
  markClassName?: string
  textClassName?: string
  /** Wrap the mark in a soft rounded card (nice on tinted headers). */
  boxed?: boolean
}

export function BrandLockup({
  className,
  markClassName,
  textClassName,
  boxed = false,
}: BrandLockupProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {boxed ? (
        <span className="flex items-center justify-center rounded-lg bg-white ring-1 ring-border shadow-sm p-1">
          <BrandMark className={cn('h-6 w-6', markClassName)} />
        </span>
      ) : (
        <BrandMark className={cn('h-8 w-8', markClassName)} />
      )}
      <Wordmark className={cn('text-base', textClassName)} />
    </div>
  )
}

export function FullLogo({ className }: { className?: string }) {
  return (
    <img
      src="/shribook-logo.png"
      alt="ShriBook"
      className={cn('object-contain select-none', className)}
      draggable={false}
    />
  )
}
