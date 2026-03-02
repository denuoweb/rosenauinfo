import { Link, NavLink, Outlet, useLoaderData, useNavigation } from 'react-router-dom'
import { Suspense, memo, useMemo, use, useState, useCallback, useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import ThemeSwitcher from './ThemeSwitcher'
import LanguageSwitcher from './LanguageSwitcher'
import { useLanguage } from '../lib/language'
import type { SupportedLanguage } from '../lib/language'
import type { AppLayoutLoaderData } from '../routes'

const navLabels = {
  en: {
    home: 'Home',
    about: 'About',
    resume: 'Resume',
    projects: 'Projects',
    contact: 'Contact'
  },
  ja: {
    home: 'ホーム',
    about: '紹介',
    resume: '履歴書',
    projects: 'プロジェクト',
    contact: '連絡先'
  }
}

type NavItem = {
  to: string
  label: string
  end?: boolean
}

type NavigationStatus = 'idle' | 'loading' | 'submitting'

export type ProfileLink = {
  label: string
  url: string
}

export type SiteCopy = {
  name: { en: string; ja: string }
  footerNote?: string
  contactEmail?: string
  profileLinks: ProfileLink[]
  resume: {
    enUrl?: string
    jaUrl?: string
    jaStatus?: string
  }
}

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
    <nav
      ref={headerRef}
      className="topnav"
      aria-label={language === 'ja' ? '主要ナビゲーション' : 'Primary navigation'}
    >
      <div className="navcontent">
        <Link to="/" className="brand" prefetch="intent">
          {siteName}
        </Link>
        <ul className="navmenu">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} prefetch="intent">
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
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
    </nav>
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
      <div className="footer-line">
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
  children
}: {
  site: SiteCopy
  language: SupportedLanguage
  navItems: NavItem[]
  navigationState: NavigationStatus
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
    <div className="container app-shell">
      <span className="route-progress" data-active={navigationState !== 'idle'} aria-hidden="true" />
      <div className="background-art" aria-hidden="true" />
      <Header
        headerRef={headerRef}
        siteName={language === 'ja' ? site.name.ja || site.name.en : site.name.en || site.name.ja}
        navItems={navItems}
        language={language}
        contactEmail={site.contactEmail}
      />
      <main className="main" data-navigation={navigationState}>
        {children}
      </main>
      <Footer site={site} language={language} />
    </div>
  )
})

function AppChromeSkeleton() {
  return (
    <div className="container app-shell">
      <nav className="topnav">
        <div className="navcontent">
          <span className="brand skeleton-block skeleton-pill" />
          <ul className="navmenu">
            {[0, 1, 2].map(n => (
              <li key={n}>
                <span className="skeleton-block skeleton-text" style={{ width: `${90 - n * 10}px` }} />
              </li>
            ))}
          </ul>
          <div className="navactions">
            <span className="skeleton-block skeleton-button" />
            <span className="skeleton-block skeleton-button" />
          </div>
        </div>
      </nav>
      <main className="main">
        <div className="page-skeleton">
          <span className="skeleton-block skeleton-heading" />
          <span className="skeleton-block skeleton-paragraph" />
          <span className="skeleton-block skeleton-paragraph" />
        </div>
      </main>
      <footer className="footer">
        <span className="skeleton-block skeleton-text" style={{ width: '160px' }} />
      </footer>
    </div>
  )
}

export default function Layout() {
  const { language } = useLanguage()
  const loaderData = useLoaderData() as AppLayoutLoaderData
  const navigation = useNavigation()

  const navItems = useMemo<NavItem[]>(() => ([
    { to: '/', label: navLabels[language].home, end: true },
    { to: '/about', label: navLabels[language].about },
    { to: '/resume', label: navLabels[language].resume },
    { to: '/projects', label: navLabels[language].projects },
    { to: '/contact', label: navLabels[language].contact }
  ]), [language])

  return (
    <Suspense fallback={<AppChromeSkeleton />}>
      <ResolvedAppChrome
        sitePromise={loaderData.site}
        language={language}
        navItems={navItems}
        navigationState={navigation.state as NavigationStatus}
      />
    </Suspense>
  )
}

function ResolvedAppChrome({
  sitePromise,
  language,
  navItems,
  navigationState
}: {
  sitePromise: Promise<Record<string, unknown> | null>
  language: SupportedLanguage
  navItems: NavItem[]
  navigationState: NavigationStatus
}) {
  const siteRecord = use(sitePromise)
  const site = normalizeSite(siteRecord)
  return (
    <AppChrome site={site} language={language} navItems={navItems} navigationState={navigationState}>
      <Outlet context={{ site }} />
    </AppChrome>
  )
}

function normalizeSite(raw: Record<string, unknown> | null): SiteCopy {
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  const rawEn = pick(raw?.name_en ?? raw?.name)
  const rawJa = pick(raw?.name_ja ?? raw?.name)
  const nameEn = rawEn || rawJa || 'Portfolio'
  const nameJa = rawJa || rawEn || 'ポートフォリオ'
  const footerNote = pick(raw?.footerNote ?? raw?.footer_note)
  const resumeEnUrl = pick(raw?.resume_url_en ?? raw?.resume_url)
  const resumeJaUrl = pick(raw?.resume_url_ja)
  const resumeJaStatus = pick(raw?.resume_ja_status)
  const contactEmail = pick(raw?.contactEmail ?? raw?.contact_email ?? raw?.email)
  const profileLinks = normalizeProfileLinks(raw, pick)

  return {
    name: { en: nameEn, ja: nameJa },
    footerNote,
    contactEmail: contactEmail || undefined,
    profileLinks,
    resume: {
      enUrl: resumeEnUrl || undefined,
      jaUrl: resumeJaUrl || undefined,
      jaStatus: resumeJaStatus || undefined
    }
  }
}

function normalizeProfileLinks(raw: Record<string, unknown> | null, pick: (value: unknown) => string): ProfileLink[] {
  if (!raw) return []

  const knownFields: Array<{ label: string; value: unknown }> = [
    { label: 'GitHub', value: raw.githubUrl ?? raw.github_url ?? raw.github },
    { label: 'LinkedIn', value: raw.linkedinUrl ?? raw.linkedin_url ?? raw.linkedin },
    { label: 'X', value: raw.xUrl ?? raw.x_url ?? raw.twitterUrl ?? raw.twitter_url ?? raw.twitter },
    { label: 'YouTube', value: raw.youtubeUrl ?? raw.youtube_url ?? raw.youtube },
    { label: 'Blog', value: raw.blogUrl ?? raw.blog_url ?? raw.blog },
    { label: 'Portfolio', value: raw.website ?? raw.websiteUrl ?? raw.website_url }
  ]

  const fromKnown = knownFields
    .map(entry => {
      const url = normalizeExternalUrl(pick(entry.value))
      if (!url) return null
      return { label: entry.label, url }
    })
    .filter((entry): entry is ProfileLink => Boolean(entry))

  const rawSameAs = raw.sameAs ?? raw.same_as ?? raw.profileLinks ?? raw.profile_links
  const fromSameAs: ProfileLink[] = []

  if (Array.isArray(rawSameAs)) {
    rawSameAs.forEach((entry, index) => {
      const url = normalizeExternalUrl(pick(entry))
      if (url) {
        fromSameAs.push({ label: `Profile ${index + 1}`, url })
      }
    })
  } else {
    pick(rawSameAs)
      .split(/\n|,/)
      .map(part => normalizeExternalUrl(part.trim()))
      .filter((url): url is string => Boolean(url))
      .forEach((url, index) => {
        fromSameAs.push({ label: `Profile ${index + 1}`, url })
      })
  }

  const deduped = new Map<string, ProfileLink>()
  ;[...fromKnown, ...fromSameAs].forEach(link => {
    if (!deduped.has(link.url)) {
      deduped.set(link.url, link)
    }
  })

  return Array.from(deduped.values())
}

function normalizeExternalUrl(value: string): string | null {
  if (!value) return null
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}
