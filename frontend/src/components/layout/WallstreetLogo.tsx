import React from 'react'

interface LogoProps {
  className?: string
  size?: number
}

/**
 * Exact Wall Street Emblem using the uploaded asset
 */
export const WallstreetEmblem: React.FC<LogoProps> = ({ className = "w-9 h-9", size = 36 }) => {
  return (
    <img
      src="/wallstreet_emblem_transparent.png"
      alt="Wall Street Emblem"
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      loading="eager"
    />
  )
}

export const WallstreetLogo = WallstreetEmblem

/**
 * Exact Full Wall Street Consulting Services Logo using the uploaded asset
 */
export const WallstreetFullLogo: React.FC<{
  className?: string
  height?: number
  emblemSize?: number
  lightText?: boolean
  compact?: boolean
}> = ({
  className = "",
  height,
  emblemSize,
  lightText = false,
  compact = false,
}) => {
  const displayHeight = height || emblemSize || 48

  if (compact) {
    return <WallstreetEmblem size={displayHeight} className={className} />
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src="/wallstreet_logo_transparent.png"
        alt="Wall Street Consulting Services"
        style={{ height: `${displayHeight}px`, width: 'auto' }}
        className="object-contain"
        loading="eager"
      />
    </div>
  )
}

export default WallstreetFullLogo
