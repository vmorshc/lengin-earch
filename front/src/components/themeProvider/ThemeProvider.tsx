import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from './ThemeContext'
import type { Theme, ThemeContextValue } from './ThemeContext'

const prefersDarkQuery = '(prefers-color-scheme: dark)'

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia(prefersDarkQuery).matches ? 'dark' : 'light'
}

type ThemeProviderProps = {
  children: ReactNode
}

function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const media = window.matchMedia(prefersDarkQuery)
    const listener = (event: MediaQueryListEvent) => setTheme(event.matches ? 'dark' : 'light')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export { ThemeProvider as default }


