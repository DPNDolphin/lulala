'use client'

import { useState } from 'react'
import { User } from 'lucide-react'

interface UserAvatarProps {
  avatar?: string
  nickname?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function UserAvatar({ 
  avatar, 
  nickname, 
  size = 'md', 
  className = '' 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-primary/20 flex items-center justify-center ${className}`}>
      {avatar && !imageError ? (
        <img
          src={avatar}
          alt={nickname || '用户头像'}
          className="w-full h-full object-cover"
          onError={handleImageError}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      ) : (
        <User className={`${iconSizes[size]} text-primary`} />
      )}
    </div>
  )
}
