import { useLayoutEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useThemeStore } from './store/themeStore'

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-theme', theme)
}

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  useLayoutEffect(() => {
    applyTheme(theme)
  }, [theme])

  return <RouterProvider router={router} />
}
