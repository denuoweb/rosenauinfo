import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from './firebase'

const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'

const mockDocs: Record<string, any> = {
  site: {
    name_en: 'Jaron Rosenau',
    name_ja: 'ジャロン ローゼナウ',
    footerNote: 'Creating helpful products since 2012',
    contactEmail: 'hello@example.com',
    github_url: 'https://github.com/denuoweb',
    linkedin_url: 'https://www.linkedin.com/in/jaronrosenau'
  },
  home: {
    blurb_en: 'Software engineer focused on geospatial web systems, resilient platforms, and product delivery.',
    blurb_ja: '地理空間ウェブシステムと安定したプロダクト開発に注力するソフトウェアエンジニアです。',
    links_en: 'Latest Case Study|/projects',
    links_ja: '最新の事例|/projects'
  },
  about: {
    headline_en: 'Software Engineer',
    headline_ja: 'ソフトウェアエンジニア',
    intro_en: 'Jaron Rosenau builds reliable web platforms with a focus on geospatial products and practical UX.',
    intro_ja: 'Jaron Rosenau は地理空間プロダクトと実用的な UX を重視した信頼性の高いウェブプラットフォームを構築しています。',
    highlights_en: 'Geospatial web mapping\nTypeScript and Python services\nProduct-focused engineering',
    highlights_ja: '地理空間ウェブマッピング\nTypeScript と Python サービス\nプロダクト志向の開発',
    links: 'GitHub|https://github.com/denuoweb\nLinkedIn|https://www.linkedin.com/in/jaronrosenau'
  },
  contact: {
    intro_en: 'Reach out to Jaron Rosenau for engineering roles, consulting, or collaboration.',
    intro_ja: '採用、コンサルティング、共同開発のご相談は Jaron Rosenau までご連絡ください。',
    availability_en: 'Typically responds within 1-2 business days.',
    availability_ja: '通常 1-2 営業日以内に返信します。'
  },
  resume: {
    url_en: 'https://example.com/resume-en.pdf',
    url_ja: 'https://example.com/resume-ja.pdf',
    ja_eta: '2025-01',
    summary_en: 'Product design leader focused on inclusive, data-informed experiences.\n\nI blend research, systems thinking, and prototyping to ship products that scale.',
    summary_ja: 'インクルーシブでデータドリブンな体験を重視するプロダクトデザインリーダーです。',
    sections: [
      {
        id: 'experience',
        title_en: 'Experience',
        title_ja: '職務経歴',
        items_en: [
          'Cycle — Staff Product Designer (2021–Present): Led the design system and accessibility standards across web and mobile.',
          'Atlas Research — Product Design Lead (2017–2021): Built research tooling adopted by 200+ researchers globally.'
        ],
        items_ja: [
          'Cycle — スタッフプロダクトデザイナー（2021–現在）：デザインシステムとアクセシビリティ基準を主導。',
          'Atlas Research — プロダクトデザインリード（2017–2021）：200名以上のリサーチャーが利用するツールを構築。'
        ]
      },
      {
        id: 'skills',
        title_en: 'Skills',
        title_ja: 'スキル',
        items_en: [
          'Design leadership, inclusive design practices, and cross-functional facilitation.',
          'Rapid prototyping with React, Storybook, and Playwright for design QA.'
        ],
        items_ja: [
          'デザインリーダーシップ、インクルーシブデザイン、クロスファンクショナルなファシリテーション。',
          'React / Storybook / Playwright を用いた高速プロトタイピングとデザイン品質管理。'
        ]
      }
    ]
  }
}

const mockProjects = [
  {
    id: 'quest-by-cycle',
    title_en: 'Quest by Cycle',
    title_ja: 'Quest by Cycle',
    description_en: 'A learning platform that pairs quests with an adaptive coaching model.',
    description_ja: 'アダプティブコーチングとクエストを組み合わせた学習プラットフォーム。',
    url: 'https://quest.cycle.so',
    repo: 'https://github.com/example/quest-by-cycle',
    order: 1,
    tags_en: ['React', 'Firebase', 'Design Systems'],
    tags_ja: ['React', 'Firebase', 'デザインシステム'],
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'atlas-research',
    title_en: 'Atlas Research',
    title_ja: 'Atlas リサーチ',
    description_en: 'Internal tooling that turns research findings into shareable narratives.',
    description_ja: 'リサーチの知見を共有可能なストーリーに変換する社内ツール。',
    url: 'https://atlas.example.com',
    repo: 'https://github.com/example/atlas-research',
    order: 2,
    tags_en: ['Remix', 'TypeScript', 'Playwright'],
    tags_ja: ['Remix', 'TypeScript', 'Playwright'],
    cover: 'https://images.unsplash.com/photo-1526402468335-8b201efb81f4?auto=format&fit=crop&w=1200&q=80'
  }
]

export async function getPublicDoc(id: string) {
  if (useMockData) {
    return mockDocs[id] ?? null
  }
  const snap = await getDoc(doc(db, 'public', id))
  return snap.exists() ? snap.data() : null
}

export async function listProjects() {
  if (useMockData) {
    return mockProjects
  }
  const q = query(collection(db, 'projects'), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
}
