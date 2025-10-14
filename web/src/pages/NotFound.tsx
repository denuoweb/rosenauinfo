import { useLanguage } from '../lib/language'

export default function NotFound() {
  const { language } = useLanguage()
  return <p>{language === 'ja' ? 'ページが見つかりません。' : 'Not found.'}</p>
}
