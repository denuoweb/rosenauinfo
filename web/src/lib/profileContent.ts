import type { LocalizedText, ProjectRecord } from './content'

export type SupportedLanguage = 'en' | 'ja'

export type LocalizedList = {
  en: string[]
  ja: string[]
}

export type AboutSection = {
  id: string
  title: LocalizedText
  items: LocalizedList
}

export type ResumeSection = {
  id: string
  title: LocalizedText
  items: LocalizedList
}

export type ProjectNarrative = {
  key: string
  priority: number
  featured: boolean
  summary: LocalizedText
  problem: LocalizedText
  owned: LocalizedText
  architecture: LocalizedText
  result: LocalizedText
}

export const CORE_ROLE_HEADLINE: LocalizedText = {
  en: 'Backend / Platform Engineer shipping data-rich web products end-to-end.',
  ja: 'データリッチな Web プロダクトをエンドツーエンドで届ける Backend / Platform Engineer。'
}

export const CORE_SUPPORTING_COPY: LocalizedText = {
  en: 'I build and operate Python/TypeScript systems across APIs, data workflows, CI/CD, cloud infrastructure, and user-facing web products.',
  ja: 'API、データワークフロー、CI/CD、クラウド基盤、ユーザー向け Web プロダクトまで、Python / TypeScript のシステムを構築・運用しています。'
}

export const SECONDARY_SPECIALIZATION: LocalizedText = {
  en: 'Secondary focus: geospatial, civic, and research-adjacent systems where maps, sensors, or field data are part of the product.',
  ja: '副次的な専門領域は、地図、センサー、フィールドデータが関わる地理空間・シビック・リサーチ隣接のシステムです。'
}

export const DEFAULT_PROFILE_LINKS = [
  { label: 'GitHub', url: 'https://github.com/denuoweb' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/jaronrosenau/' }
]

const PROJECT_NARRATIVES: Record<string, ProjectNarrative> = {
  crowdpmplatform: {
    key: 'crowdpmplatform',
    priority: 1,
    featured: true,
    summary: {
      en: 'Civic sensor-data platform for secure ingest, calibrated storage, and WebGL air-quality mapping.',
      ja: 'セキュアな ingest、校正済み保存、WebGL マッピングを備えた civic sensor-data platform。'
    },
    problem: {
      en: 'Crowd-sourced PM2.5 monitoring needs a secure ingest path, calibrated storage, and a map that turns sensor batches into something operators can use.',
      ja: 'crowd-sourced PM2.5 監視では、セキュアな ingest、校正済み保存、そしてセンサーバッチを運用画面に変える地図 UI が必要になる。'
    },
    owned: {
      en: 'Led platform architecture across secure ingest, calibrated processing, API design, deployment workflow, and the React mapping surface.',
      ja: 'セキュアな ingest、校正済み処理、API 設計、デプロイワークフロー、React ベースの地図 UI まで、プラットフォーム設計を主導。'
    },
    architecture: {
      en: 'Firebase Cloud Functions, Fastify, Cloud Storage, Firestore hourly buckets, DPoP-bound ingest, React 19, deck.gl, Google Maps WebGL, GitHub Actions.',
      ja: 'Firebase Cloud Functions、Fastify、Cloud Storage、Firestore の hourly bucket、DPoP 連携 ingest、React 19、deck.gl、Google Maps WebGL、GitHub Actions。'
    },
    result: {
      en: 'Live demo with documented device activation, MFA approval, partner-facing API routes, and an end-to-end path from sensor payloads to map layers.',
      ja: 'デバイス有効化、MFA 承認、外部向け API、センサーペイロードから地図レイヤーまでの end-to-end パイプラインを備えた live demo を公開。'
    }
  },
  questbycycle: {
    key: 'questbycycle',
    priority: 2,
    featured: true,
    summary: {
      en: 'Live Flask/Postgres product that turns cycling missions, proof submission, and leaderboards into a public web platform.',
      ja: 'サイクリングのミッション、証跡投稿、リーダーボードを public web product にまとめた Flask / Postgres プロダクト。'
    },
    problem: {
      en: 'Cycling communities needed a product that could turn missions, proof submission, badges, and leaderboards into sustained participation.',
      ja: 'サイクリングコミュニティには、ミッション、証跡投稿、バッジ、リーダーボードを継続参加につなげるプロダクトが必要だった。'
    },
    owned: {
      en: 'Built and operated the web product end-to-end, including backend services, background jobs, data model, frontend delivery, and production provisioning.',
      ja: 'バックエンド、バックグラウンドジョブ、データモデル、フロントエンド、本番基盤まで、プロダクトを end-to-end で構築・運用。'
    },
    architecture: {
      en: 'Flask, PostgreSQL, SQLAlchemy, Redis/RQ workers, Vite frontend, Gunicorn, NGINX, Poetry, pytest, Terraform, Ansible.',
      ja: 'Flask、PostgreSQL、SQLAlchemy、Redis / RQ ワーカー、Vite フロントエンド、Gunicorn、NGINX、Poetry、pytest、Terraform、Ansible。'
    },
    result: {
      en: 'Live at questbycycle.org with production infrastructure, background processing, and user-facing features spanning leaderboards, PWA flows, and notifications.',
      ja: 'questbycycle.org で live 運用されており、本番基盤、バックグラウンド処理、リーダーボード、PWA、通知などの機能を提供。'
    }
  },
  arm64adk: {
    key: 'arm64adk',
    priority: 3,
    featured: true,
    summary: {
      en: 'Rust/gRPC toolkit platform that brings packaged Android development workflows to Linux ARM64.',
      ja: 'Linux ARM64 にパッケージ化された Android 開発ワークフローを持ち込む Rust / gRPC ツールキット基盤。'
    },
    problem: {
      en: 'Android development on Linux ARM64 still lacks first-class tooling when teams need packaging, workflows, and observability instead of ad hoc scripts.',
      ja: 'Linux ARM64 上の Android 開発では、場当たり的なスクリプトではなく、パッケージング、ワークフロー、可観測性を備えたツールが不足している。'
    },
    owned: {
      en: 'Built the toolkit platform directly, shipping the service architecture, GTK UI, CLI, release packaging, and workflow around toolchains and builds.',
      ja: 'サービス構成、GTK UI、CLI、リリースパッケージング、toolchain と build のワークフローを含めて、ツールキット基盤を直接構築。'
    },
    architecture: {
      en: 'Rust workspace with 12 crates, gRPC services, GTK4 UI, CLI client, JobService event bus, workflow/build/observe services, packaged Linux ARM64 releases.',
      ja: '12 クレートの Rust workspace、gRPC サービス、GTK4 UI、CLI、JobService event bus、workflow/build/observe サービス、Linux ARM64 向けパッケージ配布。'
    },
    result: {
      en: 'Public release with packaged artifacts, a repo-hosted UI demo, and a focused open-source platform for Linux ARM64 Android development.',
      ja: '公開リリース、配布パッケージ、repo 上の UI デモを備えた Linux ARM64 向け Android 開発のオープンソース基盤。'
    }
  },
  dripcopy: {
    key: 'dripcopy',
    priority: 4,
    featured: false,
    summary: {
      en: 'Recovery-focused Linux utility for copying optical media on unstable low-power USB hosts.',
      ja: '不安定な低電力 USB ホストで光学メディアを扱うための recovery-focused Linux utility。'
    },
    problem: {
      en: 'Copying optical media on low-power USB hosts can brown out the drive, reset the bus, and corrupt long-running transfers.',
      ja: '低電力 USB ホストで光学メディアをコピーすると、電圧低下でドライブや USB バスがリセットされ、長時間の転送が壊れやすい。'
    },
    owned: {
      en: 'Built the recovery-focused utility and the operational logic around retries, remounts, resumable output, and logging.',
      ja: 'リトライ、再マウント、再開可能な出力、ログ収集を含む、復旧重視のユーティリティを実装。'
    },
    architecture: {
      en: 'Bash utility with pv rate limiting, atomic writes, retry/remount handling, path de-duplication, and structured logs.',
      ja: 'pv による速度制限、atomic write、retry/remount、パス重複排除、構造化ログを備えた Bash ユーティリティ。'
    },
    result: {
      en: 'Turns a flaky hardware problem into a reproducible Linux workflow for extracting files when standard copy tools or whole-disc imaging are too brittle.',
      ja: '標準コピーやディスク丸ごとイメージ化が不安定な状況でも、ファイル抽出を再現可能な Linux ワークフローに変える。'
    }
  }
}

export const ABOUT_DEFAULTS = {
  intro: {
    en: 'I design, build, deploy, and operate data-rich web products with a backend/platform center of gravity. Most of my work sits where product delivery meets infrastructure: APIs, data pipelines, CI/CD, Linux/cloud operations, and the user-facing surfaces that depend on them.',
    ja: 'バックエンド / プラットフォームを軸に、データリッチな Web プロダクトを設計・実装・デプロイ・運用しています。主戦場は、API、データパイプライン、CI/CD、Linux / クラウド運用、そしてそれらに依存するユーザー向け画面が交わる領域です。'
  },
  sections: [
    {
      id: 'what-i-do',
      title: {
        en: 'What I do',
        ja: '何をしているか'
      },
      items: {
        en: [
          'Build Python and TypeScript systems across APIs, background jobs, storage, and web apps.',
          'Own delivery from implementation through CI/CD, deploys, monitoring, and iteration.',
          'Use infrastructure and operations as part of product delivery rather than a separate handoff.'
        ],
        ja: [
          'API、バックグラウンドジョブ、ストレージ、Web アプリをまたぐ Python / TypeScript システムを構築する。',
          '実装から CI/CD、デプロイ、監視、改善まで一気通貫で担当する。',
          'インフラや運用を別工程ではなく、プロダクト delivery の一部として扱う。'
        ]
      }
    },
    {
      id: 'what-ive-shipped',
      title: {
        en: "What I've shipped",
        ja: '何を出荷してきたか'
      },
      items: {
        en: [
          'QuestByCycle, a live Flask/Postgres product with background jobs and production provisioning.',
          'CrowdPM Platform, a civic air-quality stack spanning secure ingest, calibrated data processing, and WebGL mapping.',
          'Open-source tooling including ARM64-ADK and DripCopy for Linux and developer-platform workflows.'
        ],
        ja: [
          'QuestByCycle: バックグラウンドジョブと本番基盤を含む、Flask / Postgres の live product。',
          'CrowdPM Platform: セキュアな ingest、校正済みデータ処理、WebGL マッピングを備えた civic air-quality stack。',
          'ARM64-ADK や DripCopy など、Linux と developer-platform workflow に関するオープンソースツール。'
        ]
      }
    },
    {
      id: 'what-i-work-well-on',
      title: {
        en: 'What I work well on',
        ja: '得意な仕事'
      },
      items: {
        en: [
          'Backend and platform work for products with real operational constraints.',
          'APIs, auth, data workflows, CI/CD, Linux, and cloud infrastructure.',
          'Geospatial, civic, and research-adjacent systems when maps, sensors, or structured field data matter.'
        ],
        ja: [
          '実運用上の制約があるプロダクトに対するバックエンド / プラットフォーム開発。',
          'API、認証、データワークフロー、CI/CD、Linux、クラウド基盤。',
          '地図、センサー、構造化フィールドデータが重要な地理空間・シビック・リサーチ隣接のシステム。'
        ]
      }
    }
  ] as AboutSection[]
}

export const RESUME_DEFAULTS = {
  summary: {
    en: [
      'Backend / Platform Engineer shipping data-rich web products end-to-end.',
      'I build and operate Python/TypeScript systems across APIs, data workflows, CI/CD, Linux/cloud infrastructure, and user-facing web products. My strongest work sits where backend systems, platform ownership, and shipped product delivery meet.'
    ],
    ja: [
      'データリッチな Web プロダクトを end-to-end で届ける Backend / Platform Engineer。',
      'API、データワークフロー、CI/CD、Linux / クラウド基盤、ユーザー向け Web プロダクトまで、Python / TypeScript のシステムを構築・運用しています。バックエンド、プラットフォーム責任、そして実際に出荷されるプロダクト delivery が交わる領域が最も強いです。'
    ]
  },
  sections: [
    {
      id: 'core-strengths',
      title: {
        en: 'Core strengths',
        ja: 'コアの強み'
      },
      items: {
        en: [
          'Backend/platform engineering with Python and TypeScript.',
          'APIs, auth flows, data systems, background processing, and operational tooling.',
          'CI/CD, Linux administration, cloud deployment, and production iteration.'
        ],
        ja: [
          'Python / TypeScript を軸にした backend / platform engineering。',
          'API、認証フロー、データシステム、バックグラウンド処理、運用ツール。',
          'CI/CD、Linux 運用、クラウドデプロイ、本番改善。'
        ]
      }
    },
    {
      id: 'selected-systems',
      title: {
        en: 'Selected shipped systems',
        ja: '主な shipped systems'
      },
      items: {
        en: [
          'QuestByCycle: built and operated a live Flask/Postgres web product with background jobs and production infrastructure.',
          'CrowdPM Platform: led platform architecture for secure civic-data ingest, calibrated processing, a Fastify API, and WebGL mapping.',
          'ARM64-ADK and DripCopy: shipped developer tooling and Linux utilities built around real platform constraints.'
        ],
        ja: [
          'QuestByCycle: バックグラウンドジョブと本番基盤を備えた live Flask / Postgres web product を構築・運用。',
          'CrowdPM Platform: セキュアな civic-data ingest、校正処理、Fastify API、WebGL マッピングのプラットフォーム設計を主導。',
          'ARM64-ADK と DripCopy: 実際の platform 制約を前提にした開発者ツールと Linux ユーティリティを出荷。'
        ]
      }
    },
    {
      id: 'working-style',
      title: {
        en: 'What I am effective on',
        ja: '力を発揮しやすい領域'
      },
      items: {
        en: [
          'Systems that need both product delivery and operational ownership.',
          'Data-rich web products where APIs, workflows, and frontend behavior have to line up cleanly.',
          'Geospatial, civic, and research-adjacent work when the product depends on maps, sensors, or structured field data.'
        ],
        ja: [
          'プロダクト delivery と運用責任の両方が必要なシステム。',
          'API、ワークフロー、フロントエンドの挙動を綺麗に接続する必要がある data-rich web product。',
          '地図、センサー、構造化フィールドデータに依存する地理空間・シビック・リサーチ隣接の仕事。'
        ]
      }
    }
  ] as ResumeSection[]
}

export function localizedValue(value: LocalizedText, language: SupportedLanguage, fallback = '') {
  const primary = language === 'ja' ? value.ja || value.en : value.en || value.ja
  return primary || fallback
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export function identifyProject(project: Pick<ProjectRecord, 'id' | 'title' | 'repo' | 'githubFullName' | 'githubRepo'>) {
  const candidates = [
    project.id,
    project.title.en,
    project.title.ja,
    project.repo || '',
    project.githubFullName || '',
    project.githubRepo || ''
  ]
    .map(value => normalizeKey(value))
    .join(' ')

  if (candidates.includes('crowdpmplatform')) return 'crowdpmplatform'
  if (candidates.includes('questbycycle')) return 'questbycycle'
  if (candidates.includes('arm64adk')) return 'arm64adk'
  if (candidates.includes('dripcopy')) return 'dripcopy'
  return ''
}

function mergeText(primary: LocalizedText, fallback: LocalizedText) {
  return {
    en: primary.en || fallback.en,
    ja: primary.ja || fallback.ja
  }
}

export function projectNarrative(project: ProjectRecord): ProjectNarrative {
  const key = identifyProject(project)
  const fallback = PROJECT_NARRATIVES[key] ?? {
    key: key || 'other',
    priority: 50,
    featured: false,
    summary: mergeText(project.description, project.problem),
    problem: mergeText(project.problem, project.description),
    owned: project.owned,
    architecture: project.architecture,
    result: mergeText(project.result, project.impact)
  }

  return {
    ...fallback,
    summary: mergeText(project.description, fallback.summary),
    problem: mergeText(project.problem, fallback.problem),
    owned: mergeText(project.owned, fallback.owned),
    architecture: mergeText(project.architecture, fallback.architecture),
    result: mergeText(project.result, fallback.result)
  }
}

export function prioritizeProjects(projects: ProjectRecord[]) {
  return [...projects].sort((left, right) => {
    const leftNarrative = projectNarrative(left)
    const rightNarrative = projectNarrative(right)
    return leftNarrative.priority - rightNarrative.priority || left.title.en.localeCompare(right.title.en)
  })
}

export function selectFeaturedProjects(projects: ProjectRecord[], featuredIds: string[], count = 3) {
  if (featuredIds.length > 0) {
    const selected = featuredIds
      .map(featuredId => projects.find(project => project.id === featuredId))
      .filter((project): project is ProjectRecord => Boolean(project))
    if (selected.length >= count) {
      return selected.slice(0, count)
    }
  }

  return prioritizeProjects(projects)
    .filter(project => projectNarrative(project).featured)
    .slice(0, count)
}

export function selectPortfolioProjects(projects: ProjectRecord[], count = 4) {
  return prioritizeProjects(projects).slice(0, count)
}
