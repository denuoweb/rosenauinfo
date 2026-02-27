import { useLocation } from 'react-router-dom'
import { useLanguage } from '../lib/language'
import { useSeo } from '../lib/seo'

export default function NotFound() {
  const { language } = useLanguage()
  const location = useLocation()
  useSeo({
    title: language === 'ja' ? 'ページが見つかりません' : 'Page not found',
    description: language === 'ja' ? '指定されたページは存在しません。' : 'The requested page does not exist.',
    path: location.pathname || '/',
    robots: 'noindex,follow'
  })
  return <p>{language === 'ja' ? 'ページが見つかりません。' : 'Not found.'}</p>
}
