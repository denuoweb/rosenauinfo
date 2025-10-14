import { useTheme } from '../lib/theme'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <label aria-label="Theme selector" style={{display:'inline-flex', alignItems:'center', gap:8}}>
      <span style={{fontSize:'.9rem'}}>Theme</span>
      <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="cyber">Cyber</option>
      </select>
    </label>
  )
}
