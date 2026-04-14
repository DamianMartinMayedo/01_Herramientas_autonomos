import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-2)',
        borderRadius: 'var(--radius-md)',
        border: '1.5px solid var(--color-border)',
        background: 'var(--color-surface-offset)',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
        transition: 'background var(--transition), color var(--transition), border-color var(--transition)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.background = 'var(--color-surface-dynamic)'
        el.style.color = 'var(--color-text)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.background = 'var(--color-surface-offset)'
        el.style.color = 'var(--color-text-muted)'
      }}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
