import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="
        p-2 rounded-lg transition-colors duration-150
        text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100
        dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800
      "
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
