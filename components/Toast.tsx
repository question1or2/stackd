'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string | null
  onDismiss: () => void
}

export default function Toast({ message, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setVisible(true)
      const t = setTimeout(() => {
        setVisible(false)
        setTimeout(onDismiss, 300)
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div
      style={{
        position: 'fixed', bottom: '2rem', left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '80px'})`,
        background: 'var(--text)', color: '#fff', fontSize: 13,
        padding: '10px 20px', borderRadius: 20, opacity: visible ? 1 : 0,
        transition: 'all 0.3s ease', zIndex: 200, whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  )
}
