import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { signOut } from '../../store/authStore'
import type { Plan } from '../../types/auth.types'

interface UserMenuProps {
  user: User
  plan: Plan | null
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Plan gratuito',
  premium: 'Plan premium',
}

export function UserMenu({ user, plan }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setOpen(false)
  }

  const emailShort = user.email?.split('@')[0] ?? 'Usuario'

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu__trigger"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="user-menu__avatar">{emailShort[0].toUpperCase()}</span>
        <span className="user-menu__name">{emailShort}</span>
      </button>
      {open && (
        <div className="user-menu__dropdown" role="menu">
          <p className="user-menu__email">{user.email}</p>
          {plan && (
            <p className="user-menu__plan">
              {PLAN_LABEL[plan] ?? plan}
            </p>
          )}
          <hr className="user-menu__divider" />
          <button
            className="user-menu__item user-menu__item--danger"
            onClick={handleSignOut}
            role="menuitem"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
