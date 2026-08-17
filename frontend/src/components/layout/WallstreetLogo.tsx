import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

/**
 * WallstreetLogo — matches the orange diamond/star compass shape from the brand image.
 * The shape is an 8-pointed star made of two overlapping squares rotated 45° relative to each other,
 * cut with an inner diamond, exactly as in the Wallstreet LLC Consulting Services brand mark.
 */
export const WallstreetLogo: React.FC<LogoProps> = ({ className = "w-9 h-9", size }) => {
  const dim = size ? `${size}px` : undefined
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={dim ? { width: dim, height: dim } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer star/compass shape — 8-pointed star made from two overlapping squares */}
      <path
        d="
          M50 5
          L62 26 L85 14 L73 37
          L95 50 L73 63 L85 86
          L62 74 L50 95
          L38 74 L15 86 L27 63
          L5 50 L27 37 L15 14
          L38 26 Z
        "
        fill="#f07c24"
      />
      {/* Inner diamond cutout */}
      <polygon
        points="50,28 72,50 50,72 28,50"
        fill="#111827"
      />
      {/* Inner small orange diamond */}
      <polygon
        points="50,36 64,50 50,64 36,50"
        fill="#f07c24"
      />
    </svg>
  )
}

export default WallstreetLogo
