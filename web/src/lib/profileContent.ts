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

export type WorkStep = {
  title: LocalizedText
  body: LocalizedText
}

export type SharedProfileCopy = {
  headline: LocalizedText
  supporting: LocalizedText
  secondarySpecialization: LocalizedText
}

export type ProjectNarrative = {
  key: string
  priority: number
  featured: boolean
  summary: LocalizedText
  problem: LocalizedText
  systems: LocalizedText
  owned: LocalizedText
  architecture: LocalizedText
  result: LocalizedText
}

export const CORE_ROLE_HEADLINE: LocalizedText = {
  en: 'Implementation / Developer Support Engineer',
  ja: '実装 / 開発者サポートエンジニア'
}

export const CORE_SUPPORTING_COPY: LocalizedText = {
  en: 'I build, integrate, debug, document, deploy, and support API-driven web systems across Python, TypeScript, Firebase, Cloud Run, PostgreSQL, Linux, and CI/CD.',
  ja: 'Python、TypeScript、Firebase、Cloud Run、PostgreSQL、Linux、CI/CD を使い、API 駆動の Web システムを構築、連携、デバッグ、文書化、デプロイ、サポートします。'
}

export const SECONDARY_SPECIALIZATION: LocalizedText = {
  en: 'I am strongest where product requirements, APIs, data models, deployment, documentation, and support meet.',
  ja: 'プロダクト要件、API、データモデル、デプロイ、ドキュメント、サポートが交差する領域を得意としています。'
}

export const DEFAULT_PROFILE_LINKS = [
  { label: 'GitHub', url: 'https://github.com/denuoweb' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/jaronrosenau/' }
]

const pick = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const LEGACY_COPY_PATTERNS = [
  /backend\s*\/\s*platform engineer/i,
  /data-rich web products?/i,
  /backend\/platform center of gravity/i,
  /geospatial,\s*civic,\s*and research-adjacent/i,
  /maps?,\s*sensors?,\s*or field data/i,
  /データリッチ/i,
  /バックエンド\s*\/\s*プラットフォーム/i,
  /地理空間|シビック|研究隣接|研究周辺/i
]

function isLegacyProfileCopy(value: string) {
  const trimmed = value.trim()
  return trimmed
    ? LEGACY_COPY_PATTERNS.some(pattern => pattern.test(trimmed))
    : false
}

export function sanitizeProfileText(value: string, fallback: string) {
  const trimmed = value.trim()
  if (!trimmed || isLegacyProfileCopy(trimmed)) {
    return fallback
  }
  return trimmed
}

export function sanitizeProfileItems(items: string[], fallback: string[]) {
  const cleaned = items
    .map(item => item.trim())
    .filter(item => item && !isLegacyProfileCopy(item))

  return cleaned.length > 0
    ? Array.from(new Set(cleaned))
    : [...fallback]
}

export const HOME_PROOF_POINTS: LocalizedList = {
  en: [
    'Target roles: implementation, developer support, technical support, integration',
    'APIs, auth, webhooks, SQL, cloud operations, and runbooks',
    'Public products, marketplace systems, and operational tooling shipped in production'
  ],
  ja: [
    '対象ロール: 実装、開発者サポート、技術サポート、連携',
    'API、認証、Webhook、SQL、クラウド運用、ランブック',
    '公開プロダクト、マーケットプレイスシステム、運用ツールを本番で出荷'
  ]
}

export const HOW_I_WORK_STEPS: WorkStep[] = [
  {
    title: {
      en: 'Discover',
      ja: 'Discover'
    },
    body: {
      en: 'Clarify requirements and system boundaries.',
      ja: '要件とシステム境界を明確にする。'
    }
  },
  {
    title: {
      en: 'Integrate',
      ja: 'Integrate'
    },
    body: {
      en: 'Connect APIs, auth, and data flows.',
      ja: 'API、認証、データフローを接続する。'
    }
  },
  {
    title: {
      en: 'Operate',
      ja: 'Operate'
    },
    body: {
      en: 'Deploy, monitor, troubleshoot, and document.',
      ja: 'デプロイ、監視、トラブルシュート、ドキュメント化を行う。'
    }
  },
  {
    title: {
      en: 'Improve',
      ja: 'Improve'
    },
    body: {
      en: 'Tighten the workflow after real use.',
      ja: '実運用の後でワークフローを締める。'
    }
  }
]

export const INTEGRATION_AUTOMATION_ITEMS: LocalizedList = {
  en: [
    'API integration',
    'Customer-facing technical troubleshooting',
    'Technical onboarding and support runbooks',
    'Webhook consumers and producers',
    'Background processing',
    'SQL and data validation',
    'Cloud-hosted services',
    'Debugging production data and auth issues'
  ],
  ja: [
    'API 連携',
    '顧客向けの技術的トラブルシュート',
    '技術オンボーディングとサポート用ランブック',
    'Webhook の consumer / producer 実装',
    'バックグラウンド処理',
    'SQL とデータバリデーション',
    'クラウドホスト型サービス',
    '本番データと認証まわりの不具合調査'
  ]
}

const PROJECT_NARRATIVES: Record<string, ProjectNarrative> = {
  crowdpmplatform: {
    key: 'crowdpmplatform',
    priority: 3,
    featured: true,
    summary: {
      en: 'Secure ingest and monitoring platform connecting device auth, partner APIs, calibrated processing, and operator-facing mapping.',
      ja: 'デバイス認証、外部 API、校正処理、運用向けマッピングをつなぐセキュアな ingest / 監視プラットフォーム。'
    },
    problem: {
      en: 'Air-quality monitoring needed a working path from device activation through secure ingest, calibrated storage, and an operator-facing map.',
      ja: '空気質監視には、デバイス有効化からセキュアな ingest、校正済み保存、運用者向け地図までつながる仕組みが必要だった。'
    },
    systems: {
      en: 'Device activation, MFA approval, DPoP-bound ingest, partner API routes, calibrated storage, Firestore buckets, and a React/WebGL operations surface.',
      ja: 'デバイス有効化、MFA 承認、DPoP 付き ingest、外部 API、校正済み保存、Firestore bucket、React/WebGL の運用画面。'
    },
    owned: {
      en: 'Technical discovery, platform architecture, API design, deployment workflow, mapping client delivery, and end-to-end demo operations.',
      ja: '技術調査、プラットフォーム設計、API 設計、デプロイ導線、地図クライアント実装、デモ運用まで担当。'
    },
    architecture: {
      en: 'Fastify on Firebase Cloud Functions, Cloud Storage, Firestore hourly buckets, React 19, deck.gl, Google Maps WebGL, and GitHub Actions.',
      ja: 'Firebase Cloud Functions 上の Fastify、Cloud Storage、Firestore の hourly bucket、React 19、deck.gl、Google Maps WebGL、GitHub Actions。'
    },
    result: {
      en: 'Live demo with documented auth and approval flows, partner-facing routes, and an end-to-end path from sensor payloads to map layers.',
      ja: '認証と承認フロー、外部向けルート、センサーペイロードから地図レイヤーまでの経路を備えた live demo を公開。'
    }
  },
  questbycycle: {
    key: 'questbycycle',
    priority: 1,
    featured: true,
    summary: {
      en: 'Public Flask/PostgreSQL system covering auth, background jobs, deployment, and production support for a cycling platform.',
      ja: '認証、バックグラウンドジョブ、デプロイ、本番サポートまで含む Flask / PostgreSQL の公開システム。'
    },
    problem: {
      en: 'Cycling program operators needed a public system that could turn missions, proof submission, badges, and leaderboards into a repeatable operational program.',
      ja: 'サイクリング施策の運営側には、ミッション、証跡投稿、バッジ、リーダーボードを運用可能な仕組みにする公開システムが必要だった。'
    },
    systems: {
      en: 'Public-facing Flask/PostgreSQL app, account/auth flows, RQ background jobs, notifications, admin operations, and deployment/monitoring paths.',
      ja: '公開向け Flask/PostgreSQL アプリ、認証フロー、RQ バックグラウンドジョブ、通知、管理運用導線、デプロイ / 監視。'
    },
    owned: {
      en: 'Technical discovery, data model, backend services, frontend delivery, infrastructure provisioning, and post-launch production troubleshooting.',
      ja: '技術調査、データモデル、バックエンド、フロントエンド、本番基盤、公開後の本番トラブル対応まで担当。'
    },
    architecture: {
      en: 'Flask, PostgreSQL, SQLAlchemy, Redis/RQ workers, Vite frontend, Gunicorn, NGINX, Terraform, Ansible, Poetry, and pytest.',
      ja: 'Flask、PostgreSQL、SQLAlchemy、Redis / RQ ワーカー、Vite フロントエンド、Gunicorn、NGINX、Terraform、Ansible、Poetry、pytest。'
    },
    result: {
      en: 'Pilot operations with 100+ users, live production deployment, and production issues handled after launch across auth, jobs, notifications, and user support.',
      ja: '100 人超の利用を含む pilot 運用、本番公開、そして認証・ジョブ・通知・利用者対応まで含む公開後の本番トラブル対応。'
    }
  },
  moonshineart: {
    key: 'moonshineart',
    priority: 2,
    featured: true,
    summary: {
      en: 'Workflow and integration system for artist onboarding, checkout, fulfillment, and operational automation.',
      ja: 'アーティスト登録、購入、発送、運用自動化をつなぐワークフロー / 連携システム。'
    },
    problem: {
      en: 'The business needed onboarding, order handling, and fulfillment to behave like one reliable workflow instead of a loose collection of manual steps.',
      ja: '登録、受注、発送を、ばらばらな手作業ではなく、一貫したワークフローとして機能させる必要があった。'
    },
    systems: {
      en: 'Artist onboarding, checkout and fulfillment flow, operational automation, and Firebase/Cloud Run backend integration points.',
      ja: 'アーティスト登録、購入 / 発送フロー、運用自動化、Firebase / Cloud Run のバックエンド連携ポイント。'
    },
    owned: {
      en: 'Integration design, backend implementation, workflow automation, and the operational path needed to keep the flow moving.',
      ja: '連携設計、バックエンド実装、ワークフロー自動化、運用導線の整備を担当。'
    },
    architecture: {
      en: 'Firebase and Cloud Run services coordinating onboarding data, commerce flow, fulfillment state, and operational handoffs.',
      ja: 'Firebase と Cloud Run を使い、登録データ、購入フロー、発送状態、運用ハンドオフを連携させる構成。'
    },
    result: {
      en: 'Reframed a storefront as an operational system with clearer handoffs, less manual coordination, and repeatable backend workflow.',
      ja: 'ストアを単なる見せ方ではなく、引き継ぎが明確で手作業が減る、再現可能なバックエンドワークフローとして整えた。'
    }
  },
  apkworkbench: {
    key: 'apkworkbench',
    priority: 4,
    featured: false,
    summary: {
      en: 'Operational developer-tooling case study focused on workflow orchestration, packaging, and supportable Android tooling for Linux ARM64.',
      ja: 'Linux ARM64 向けに、ワークフロー制御、配布、保守しやすさを重視した開発ツールケーススタディ。'
    },
    problem: {
      en: 'Android development on Linux ARM64 needed a supportable workflow with packaging, orchestration, and observability instead of ad hoc scripts.',
      ja: 'Linux ARM64 上の Android 開発には、場当たり的なスクリプトではなく、配布、ワークフロー制御、可観測性を備えた仕組みが必要だった。'
    },
    systems: {
      en: 'GTK UI, CLI client, gRPC services, workflow jobs, package distribution, and observability around Android toolchain tasks.',
      ja: 'GTK UI、CLI、gRPC サービス、ワークフロージョブ、パッケージ配布、Android toolchain 作業の可観測性。'
    },
    owned: {
      en: 'Designed and built the service architecture, GTK UI, CLI, packaging, and workflow orchestration around builds and releases.',
      ja: 'サービス構成、GTK UI、CLI、パッケージング、ビルド / リリースのワークフロー制御を設計・実装。'
    },
    architecture: {
      en: 'Rust workspace with 12 crates, gRPC services, GTK4 UI, CLI client, JobService event bus, workflow/build/observe services, and packaged Linux ARM64 releases.',
      ja: '12 クレートの Rust workspace、gRPC サービス、GTK4 UI、CLI、JobService event bus、workflow/build/observe サービス、Linux ARM64 向けパッケージ配布。'
    },
    result: {
      en: 'Public release with packaged artifacts, a repo-hosted UI demo, and a repeatable workflow for Linux ARM64 Android development.',
      ja: '配布パッケージ、repo 上の UI デモ、Linux ARM64 向け Android 開発の再現可能なワークフローを備えた公開リリース。'
    }
  },
  dripcopy: {
    key: 'dripcopy',
    priority: 5,
    featured: false,
    summary: {
      en: 'Operational utility that turns fragile media-copying work into a resumable Linux workflow.',
      ja: '壊れやすいメディアコピー作業を再開可能な Linux ワークフローに変える運用ユーティリティ。'
    },
    problem: {
      en: 'Copying optical media on low-power USB hosts can brown out the drive, reset the bus, and corrupt long-running transfers.',
      ja: '低電力 USB ホストで光学メディアをコピーすると、電圧低下でドライブや USB バスがリセットされ、長時間の転送が壊れやすい。'
    },
    systems: {
      en: 'USB storage, retry/remount handling, rate-limited transfer, resumable outputs, and structured logging around unreliable hardware.',
      ja: 'USB ストレージ、不安定なハードウェア向けの retry/remount、速度制御転送、再開可能な出力、構造化ログ。'
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
    en: 'I work on implementation and developer-support problems where requirements, APIs, auth, operations, documentation, and production support all need to line up.',
    ja: '要件、API、認証、運用、本番サポートを一つの delivery としてそろえる必要がある、複雑な実装案件で力を発揮します。'
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
          'Build, integrate, debug, document, deploy, and support API-driven web systems in Python and TypeScript.',
          'Handle customer-facing troubleshooting, technical onboarding, runbooks, and escalation-quality bug reproduction.',
          'Carry delivery from technical discovery through implementation, deployment, and production support.',
          'Treat auth, data validation, cloud operations, and troubleshooting as part of the job, not a separate handoff.'
        ],
        ja: [
          'API 駆動の Web システムを Python / TypeScript で構築、連携、デバッグ、文書化、デプロイ、サポートする。',
          '技術調査から実装、デプロイ、本番サポートまで一気通貫で担当する。',
          '認証、データバリデーション、クラウド運用、トラブル対応を別工程ではなく delivery の一部として扱う。'
        ]
      }
    },
    {
      id: 'what-ive-shipped',
      title: {
        en: 'Selected delivery examples',
        ja: '主な delivery 事例'
      },
      items: {
        en: [
          'QuestByCycle: public Flask/PostgreSQL system with auth, background jobs, deployment, and post-launch support.',
          'Moonshine Art: private marketplace architecture spanning checkout, seller onboarding, fulfillment, admin/support workflows, and compliance surfaces.',
          'CrowdPM Platform: secure ingest, auth, partner APIs, data processing, and operator-facing monitoring in one cloud-hosted system.',
          'Public tooling and operational utilities shipped around real constraints, including Linux workflows and developer tooling.'
        ],
        ja: [
          'QuestByCycle: 認証、バックグラウンドジョブ、デプロイ、公開後サポートまで含む Flask / PostgreSQL の公開システム。',
          'CrowdPM Platform: セキュアな ingest、認証、外部 API、データ処理、運用向け監視画面を一つにつないだクラウドホスト型システム。',
          'Linux のワークフローや開発者向けツールを含む、実際の制約に向き合った公開ツールと運用ユーティリティ。'
        ]
      }
    },
    {
      id: 'what-i-work-well-on',
      title: {
        en: 'How I work',
        ja: '進め方'
      },
      items: {
        en: [
          'Discover: clarify requirements, system boundaries, and failure points before code becomes expensive.',
          'Integrate: connect APIs, auth flows, data models, and background processing into one working path.',
          'Operate: deploy, monitor, troubleshoot, document, and keep the system usable after launch.'
        ],
        ja: [
          'Discover: コード変更が高くつく前に、要件、境界、壊れやすい点を明確にする。',
          'Integrate: API、認証フロー、データモデル、バックグラウンド処理を一つの経路にまとめる。',
          'Operate: デプロイ、監視、トラブルシュート、ドキュメント化を行い、公開後も使える状態を保つ。'
        ]
      }
    },
    {
      id: 'integration-automation',
      title: {
        en: 'Integration / Automation',
        ja: '連携 / 自動化'
      },
      items: {
        en: [...INTEGRATION_AUTOMATION_ITEMS.en],
        ja: [...INTEGRATION_AUTOMATION_ITEMS.ja]
      }
    }
  ] as AboutSection[]
}

export const RESUME_DEFAULTS = {
  summary: {
    en: [
      'Implementation / Developer Support Engineer.',
      'I build, integrate, debug, document, deploy, and support API-driven web systems across Python, TypeScript, Firebase, Cloud Run, PostgreSQL, Linux, and CI/CD.'
    ],
    ja: [
      '実装 / 開発者サポートエンジニア。',
      'Python、TypeScript、Firebase、Cloud Run、PostgreSQL、Linux、CI/CD を使い、API 駆動の Web システムを構築、連携、デバッグ、文書化、デプロイ、サポートします。'
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
          'API integration, customer-facing technical troubleshooting, auth flows, webhooks, background processing, SQL, data validation, and cloud-hosted services.',
          'Python and TypeScript delivery across backend services, operational tooling, and public web products.',
          'Production troubleshooting, deployment, monitoring, and documentation after launch.'
        ],
        ja: [
          'API 連携、認証フロー、Webhook、バックグラウンド処理、SQL、データバリデーション、クラウドホスト型サービス。',
          'バックエンドサービス、運用ツール、公開 Web プロダクトにまたがる Python / TypeScript の delivery。',
          '公開後の本番トラブル対応、デプロイ、監視、ドキュメント整備。'
        ]
      }
    },
    {
      id: 'selected-systems',
      title: {
        en: 'Selected delivery examples',
        ja: '主な delivery 事例'
      },
      items: {
        en: [
          'QuestByCycle: public Flask/PostgreSQL system with auth, background jobs, deployment, and production support.',
          'Moonshine Art: marketplace implementation case study spanning checkout, seller onboarding, fulfillment, admin/support workflows, and compliance surfaces.',
          'CrowdPM Platform: secure ingest, auth, partner APIs, data processing, and operator-facing monitoring in one cloud-hosted system.',
          'Operational tooling shipped around real constraints, including Linux workflows and developer-platform utilities.'
        ],
        ja: [
          'QuestByCycle: 認証、バックグラウンドジョブ、デプロイ、本番サポートを含む Flask / PostgreSQL の公開システム。',
          'CrowdPM Platform: セキュアな ingest、認証、外部 API、データ処理、運用向け監視画面を一つにつないだクラウドホスト型システム。',
          'Linux ワークフローや開発者向け基盤ユーティリティを含む、実際の制約に向き合った運用ツール。'
        ]
      }
    },
    {
      id: 'working-style',
      title: {
        en: 'How I work',
        ja: '進め方'
      },
      items: {
        en: [
          'Discover: clarify requirements, boundaries, and failure points before code becomes expensive.',
          'Integrate: connect APIs, auth, data flows, and background processing into one reliable path.',
          'Operate and improve: deploy, monitor, troubleshoot, document, and tighten the workflow after real use.'
        ],
        ja: [
          'Discover: コード変更が高くつく前に、要件、境界、壊れやすい点を明確にする。',
          'Integrate: API、認証、データフロー、バックグラウンド処理を一つの信頼できる経路にまとめる。',
          'Operate / Improve: デプロイ、監視、トラブルシュート、ドキュメント化を行い、実運用の後でワークフローを締める。'
        ]
      }
    },
    {
      id: 'integration-automation',
      title: {
        en: 'Integration / Automation',
        ja: '連携 / 自動化'
      },
      items: {
        en: [...INTEGRATION_AUTOMATION_ITEMS.en],
        ja: [...INTEGRATION_AUTOMATION_ITEMS.ja]
      }
    }
  ] as ResumeSection[]
}

export function localizedValue(value: LocalizedText, language: SupportedLanguage, fallback = '') {
  const primary = language === 'ja' ? value.ja || value.en : value.en || value.ja
  return primary || fallback
}

export function resolveSharedProfileCopy(home: Record<string, unknown> | null | undefined): SharedProfileCopy {
  const fallbackHeadline = pick(home?.headline)
  const fallbackSupporting = pick(home?.supporting ?? home?.blurb)
  const fallbackSecondary = pick(home?.secondary ?? home?.secondary_specialization)

  return {
    headline: {
      en: sanitizeProfileText(pick(home?.headline_en) || fallbackHeadline, CORE_ROLE_HEADLINE.en),
      ja: sanitizeProfileText(pick(home?.headline_ja) || fallbackHeadline, CORE_ROLE_HEADLINE.ja)
    },
    supporting: {
      en: sanitizeProfileText(
        pick(home?.supporting_en ?? home?.blurb_en) || fallbackSupporting,
        CORE_SUPPORTING_COPY.en
      ),
      ja: sanitizeProfileText(
        pick(home?.supporting_ja ?? home?.blurb_ja) || fallbackSupporting,
        CORE_SUPPORTING_COPY.ja
      )
    },
    secondarySpecialization: {
      en: sanitizeProfileText(
        pick(home?.secondary_en ?? home?.secondary_specialization_en) || fallbackSecondary,
        SECONDARY_SPECIALIZATION.en
      ),
      ja: sanitizeProfileText(
        pick(home?.secondary_ja ?? home?.secondary_specialization_ja) || fallbackSecondary,
        SECONDARY_SPECIALIZATION.ja
      )
    }
  }
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
  if (candidates.includes('moonshineart')) return 'moonshineart'
  if (candidates.includes('apkworkbench')) return 'apkworkbench'
  if (candidates.includes('arm64adk')) return 'apkworkbench'
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
    systems: mergeText(project.architecture, project.owned),
    owned: project.owned,
    architecture: project.architecture,
    result: mergeText(project.result, project.impact)
  }

  return {
    ...fallback,
    summary: mergeText(project.description, fallback.summary),
    problem: mergeText(project.problem, fallback.problem),
    systems: mergeText(project.architecture, fallback.systems),
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
      .filter(project => projectNarrative(project).featured)

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
