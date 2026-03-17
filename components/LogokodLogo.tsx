interface LogokodLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LogokodLogo({ className = '', size = 'md' }: LogokodLogoProps) {
  const heights: Record<typeof size, number> = { sm: 22, md: 28, lg: 36 }
  const h = heights[size]

  return (
    <svg
      height={h}
      viewBox="0 0 148 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logokod"
    >
      {/* Barcode mark — 6 vertical bars of varying heights */}
      <rect x="0"  y="4"  width="3" height="20" rx="1" fill="#f59e0b" />
      <rect x="5"  y="0"  width="2" height="28" rx="1" fill="#f59e0b" />
      <rect x="9"  y="7"  width="3" height="14" rx="1" fill="#f59e0b" />
      <rect x="14" y="2"  width="2" height="24" rx="1" fill="#f59e0b" />
      <rect x="18" y="6"  width="3" height="16" rx="1" fill="#f59e0b" />
      <rect x="23" y="0"  width="2" height="28" rx="1" fill="#f59e0b" />

      {/* Wordmark */}
      <text
        x="32"
        y="21"
        fontFamily="'Arial Black', 'Arial Bold', Arial, sans-serif"
        fontWeight="900"
        fontSize="17"
        letterSpacing="1.5"
        fill="#f59e0b"
      >
        LOGOKOD
      </text>
    </svg>
  )
}
