import type { ChangeEvent } from 'react'
import { isTheme, themes, useTheme } from '../lib/theme'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextTheme = event.target.value
    if (isTheme(nextTheme)) {
      setTheme(nextTheme)
    }
  }

  return (
    <label className="theme-switcher">
      <span className="theme-switcher-label">Theme</span>
      <select className="theme-switcher-select" aria-label="Theme selector" value={theme} onChange={handleChange}>
        {themes.map(option => (
          <option key={option} value={option}>
            {option[0].toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </label>
  )
}
