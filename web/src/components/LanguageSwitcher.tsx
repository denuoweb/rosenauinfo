import { useLanguage } from '../lib/language'

type LanguageOption = {
  code: 'en' | 'ja'
  label: string
  flag: string
}

const options: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '/flags/us.svg' },
  { code: 'ja', label: '日本語', flag: '/flags/jp.svg' }
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="language-switcher" aria-label="Language selector">
      {options.map(option => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLanguage(option.code)}
          className={language === option.code ? 'active' : ''}
          title={option.label}
          aria-pressed={language === option.code}
        >
          <img src={option.flag} alt={`${option.label} flag`} width={24} height={16} />
        </button>
      ))}
    </div>
  )
}
