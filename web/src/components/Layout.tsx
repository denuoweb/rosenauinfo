import { Link, NavLink, Outlet, useLoaderData, useLocation, useNavigation } from 'react-router-dom'
import { Suspense, memo, useMemo, use, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import ThemeSwitcher from './ThemeSwitcher'
import LanguageSwitcher from './LanguageSwitcher'
import { useLanguage } from '../lib/language'
import type { SupportedLanguage } from '../lib/language'
import { getLocalizedSiteName, normalizeSite, type SiteCopy } from '../lib/site'
import type { AppLayoutLoaderData } from '../routes'

const navLabels = {
  en: {
    home: 'Home',
    about: 'About',
    resume: 'Resume',
    projects: 'Case Studies',
    contact: 'Contact'
  },
  ja: {
    home: 'ホーム',
    about: '紹介',
    resume: '履歴書',
    projects: '事例',
    contact: '連絡先'
  }
}

type NavItem = {
  to: string
  label: string
  end?: boolean
}

type NavigationStatus = 'idle' | 'loading' | 'submitting'
type RouteMode = 'default' | 'projects'

export type AppShellContext = {
  site: SiteCopy
}

const Header = memo(function Header({
  headerRef,
  siteName,
  navItems,
  language,
  contactEmail
}: {
  headerRef: RefObject<HTMLElement | null>
  siteName: string
  navItems: NavItem[]
  language: SupportedLanguage
  contactEmail?: string
}) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<number | null>(null)
  const contactLabel = language === 'ja' ? 'メール' : 'Email'
  const ariaLabel = contactEmail
    ? `${contactLabel}: ${contactEmail}`
    : contactLabel
  const copyButtonLabel = language === 'ja' ? 'メールアドレスをコピー' : 'Copy email address'
  const copiedLabel = language === 'ja' ? 'コピーしました' : 'Copied!'

  const clearCopyTimer = useCallback(() => {
    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current)
      resetTimer.current = null
    }
  }, [])

  useEffect(() => clearCopyTimer, [clearCopyTimer])

  const runFallbackCopy = useCallback((text: string) => {
    if (typeof document === 'undefined') return
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }, [])

  const handleCopyClick = useCallback(async () => {
    if (!contactEmail) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(contactEmail)
      } else {
        runFallbackCopy(contactEmail)
      }
      setCopied(true)
      clearCopyTimer()
      resetTimer.current = window.setTimeout(() => {
        setCopied(false)
        resetTimer.current = null
      }, 2000)
    } catch {
      setCopied(false)
    }
  }, [clearCopyTimer, contactEmail, runFallbackCopy])

  return (
    <header
      ref={headerRef}
      className="topnav"
    >
      <div className="navcontent shell-frame">
        <Link to="/" className="brand" prefetch="intent">
          {siteName}
        </Link>
        <nav
          className="navlinks"
          aria-label={language === 'ja' ? '主要ナビゲーション' : 'Primary navigation'}
        >
          <ul className="navmenu">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} prefetch="intent">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="navactions">
          {contactEmail && (
            <div className="nav-contact-group">
              <a
                href={`mailto:${contactEmail}`}
                className="nav-contact"
                aria-label={ariaLabel}
                title={contactEmail}
              >
                {contactEmail}
              </a>
              <button
                type="button"
                className="nav-copy-btn"
                onClick={handleCopyClick}
                aria-label={copied ? copiedLabel : copyButtonLabel}
                title={copied ? copiedLabel : copyButtonLabel}
                data-copied={copied}
              >
                <svg
                  className="nav-copy-icon"
                  viewBox="0 0 20 20"
                  role="img"
                  aria-hidden="true"
                >
                  <path
                    d="M6.5 5.5A1.5 1.5 0 0 1 8 4h7a1.5 1.5 0 0 1 1.5 1.5V13A1.5 1.5 0 0 1 15 14.5H8A1.5 1.5 0 0 1 6.5 13V5.5Zm1.5-.5a.5.5 0 0 0-.5.5V13a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V5.5a.5.5 0 0 0-.5-.5H8Z"
                  />
                  <path
                    d="M4 7h-.5A1.5 1.5 0 0 0 2 8.5v7A1.5 1.5 0 0 0 3.5 17H11a1.5 1.5 0 0 0 1.5-1.5V15H11v.5a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5H4V7Z"
                  />
                </svg>
              </button>
              <span className="sr-only" aria-live="polite">
                {copied ? copiedLabel : ''}
              </span>
            </div>
          )}
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
})

const Footer = memo(function Footer({
  site,
  language
}: {
  site: SiteCopy
  language: SupportedLanguage
}) {
  const year = new Date().getFullYear()
  const baseCopy = language === 'ja'
    ? site.footerNote || `© ${year} ${site.name.ja || site.name.en}`
    : site.footerNote || `© ${year} ${site.name.en || site.name.ja}`

  return (
    <footer className="footer">
      <div className="footer-line shell-frame">
        <small>{baseCopy}</small>
      </div>
    </footer>
  )
})

const AppChrome = memo(function AppChrome({
  site,
  language,
  navItems,
  navigationState,
  routeMode,
  children
}: {
  site: SiteCopy
  language: SupportedLanguage
  navItems: NavItem[]
  navigationState: NavigationStatus
  routeMode: RouteMode
  children: ReactNode
}) {
  const headerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const updateHeaderOffset = () => {
      const nextHeight = Math.ceil(headerRef.current?.getBoundingClientRect().height ?? 72)
      root.style.setProperty('--header-offset', `${nextHeight}px`)
    }

    updateHeaderOffset()

    const header = headerRef.current
    let observer: ResizeObserver | null = null

    if (header && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateHeaderOffset()
      })
      observer.observe(header)
    }

    window.addEventListener('resize', updateHeaderOffset)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateHeaderOffset)
      root.style.removeProperty('--header-offset')
    }
  }, [language, site.contactEmail])

  return (
    <div className={`container app-shell ${routeMode === 'projects' ? 'app-shell--wide' : ''}`}>
      <a className="skip-link" href="#main-content">
        {language === 'ja' ? '本文へ移動' : 'Skip to content'}
      </a>
      <span className="route-progress" data-active={navigationState !== 'idle'} aria-hidden="true" />
      <div className="background-art" aria-hidden="true" />
      <Header
        headerRef={headerRef}
        siteName={getLocalizedSiteName(site, language)}
        navItems={navItems}
        language={language}
        contactEmail={site.contactEmail}
      />
      <main id="main-content" className="main">
        {children}
      </main>
      <Footer site={site} language={language} />
    </div>
  )
})

export function LayoutHydrateFallback() {
  return (
    <div className="container app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <nav className="topnav">
        <div className="navcontent shell-frame">
          <span className="brand skeleton-block skeleton-pill" />
          <div className="navlinks">
            <ul className="navmenu">
              {[0, 1, 2].map(n => (
                <li key={n}>
                  <span className="skeleton-block skeleton-text" style={{ width: `${90 - n * 10}px` }} />
                </li>
              ))}
            </ul>
          </div>
          <div className="navactions">
            <span className="skeleton-block skeleton-button" />
            <span className="skeleton-block skeleton-button" />
          </div>
        </div>
      </nav>
      <main id="main-content" className="main">
        <div className="page-skeleton">
          <span className="skeleton-block skeleton-heading" />
          <span className="skeleton-block skeleton-paragraph" />
          <span className="skeleton-block skeleton-paragraph" />
        </div>
      </main>
      <footer className="footer">
        <div className="footer-line shell-frame">
          <span className="skeleton-block skeleton-text" style={{ width: '160px' }} />
        </div>
      </footer>
    </div>
  )
}

export default function Layout() {
  const { language } = useLanguage()
  const loaderData = useLoaderData() as AppLayoutLoaderData
  const location = useLocation()
  const navigation = useNavigation()
  const routeMode: RouteMode = location.pathname.startsWith('/projects') ? 'projects' : 'default'

  const navItems = useMemo<NavItem[]>(() => ([
    { to: '/', label: navLabels[language].home, end: true },
    { to: '/about', label: navLabels[language].about },
    { to: '/resume', label: navLabels[language].resume },
    { to: '/projects', label: navLabels[language].projects },
    { to: '/contact', label: navLabels[language].contact }
  ]), [language])

  return (
    <Suspense fallback={<LayoutHydrateFallback />}>
      <ResolvedAppChrome
        sitePromise={loaderData.site}
        language={language}
        navItems={navItems}
        navigationState={navigation.state as NavigationStatus}
        routeMode={routeMode}
      />
    </Suspense>
  )
}

function ResolvedAppChrome({
  sitePromise,
  language,
  navItems,
  navigationState,
  routeMode
}: {
  sitePromise: Promise<Record<string, unknown> | null>
  language: SupportedLanguage
  navItems: NavItem[]
  navigationState: NavigationStatus
  routeMode: RouteMode
}) {
  const siteRecord = use(sitePromise)
  const site = normalizeSite(siteRecord)
  return (
    <AppChrome
      site={site}
      language={language}
      navItems={navItems}
      navigationState={navigationState}
      routeMode={routeMode}
    >
      <Outlet context={{ site }} />
    </AppChrome>
  )
}
