import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from './firebase'

const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'

export type LocalizedText = {
  en: string
  ja: string
}

export type ProjectRecord = {
  id: string
  title: LocalizedText
  description: LocalizedText
  problem: LocalizedText
  owned: LocalizedText
  architecture: LocalizedText
  result: LocalizedText
  impact: LocalizedText
  url?: string
  repo?: string
  tags: { en: string[]; ja: string[] }
  cover?: string
  githubFullName?: string
  githubOwner?: string
  githubRepo?: string
  githubUpdatedAt?: string
  githubPushedAt?: string
}

const mockDocs: Record<string, any> = {
  site: {
    name_en: 'Jaron Rosenau',
    name_ja: 'ジャロン・ローゼナウ',
    footerNote: 'Built around shipped systems, not generic portfolio copy.',
    contactEmail: 'jaron@rosenau.info',
    github_url: 'https://github.com/denuoweb',
    linkedin_url: 'https://www.linkedin.com/in/jaronrosenau'
  },
  home: {
    headline_en: 'Backend / Platform Engineer shipping data-rich web products end-to-end.',
    headline_ja: 'データリッチな Web プロダクトをエンドツーエンドで届ける Backend / Platform Engineer。',
    supporting_en: 'I build and operate Python/TypeScript systems across APIs, data workflows, CI/CD, cloud infrastructure, and user-facing web products.',
    supporting_ja: 'API、データワークフロー、CI/CD、クラウド基盤、ユーザー向け Web プロダクトまで、Python / TypeScript のシステムを構築・運用しています。',
    featured_project_ids: ['crowdpm-platform', 'quest-by-cycle', 'arm64-adk'],
    links_en: 'Resume | /resume\nProjects / Case Studies | /projects\nGitHub | https://github.com/denuoweb\nLinkedIn | https://www.linkedin.com/in/jaronrosenau',
    links_ja: '履歴書 | /resume\nプロジェクト / 事例 | /projects\nGitHub | https://github.com/denuoweb\nLinkedIn | https://www.linkedin.com/in/jaronrosenau'
  },
  about: {
    headline_en: 'Backend / Platform Engineer',
    headline_ja: 'Backend / Platform Engineer',
    intro_en: 'I design, build, deploy, and operate data-rich web products with a backend/platform center of gravity.',
    intro_ja: 'バックエンド / プラットフォームを軸に、データリッチな Web プロダクトを設計・実装・デプロイ・運用しています。',
    what_i_do_en: 'Build Python and TypeScript systems across APIs, background jobs, storage, and web apps.\nOwn delivery from implementation through CI/CD, deploys, and iteration.\nUse infrastructure and operations as part of product delivery rather than a handoff.',
    what_i_do_ja: 'API、バックグラウンドジョブ、ストレージ、Web アプリをまたぐ Python / TypeScript システムを構築する。\n実装から CI/CD、デプロイ、改善まで一気通貫で担当する。\nインフラや運用を別工程ではなく、プロダクト delivery の一部として扱う。',
    what_ive_shipped_en: 'QuestByCycle, a live Flask/Postgres web product with background jobs and production provisioning.\nCrowdPM Platform, a civic air-quality stack spanning secure ingest, calibrated data processing, and WebGL mapping.\nOpen-source tooling including ARM64-ADK and DripCopy for Linux and developer-platform workflows.',
    what_ive_shipped_ja: 'QuestByCycle: バックグラウンドジョブと本番基盤を含む、Flask / Postgres のライブ Web プロダクト。\nCrowdPM Platform: セキュアな ingest、校正済みデータ処理、WebGL マッピングを備えたシビック向け空気質システム。\nARM64-ADK や DripCopy など、Linux と開発者向け基盤に関するオープンソースツール。',
    what_i_work_well_on_en: 'Backend and platform work for products with real operational constraints.\nAPIs, auth, data workflows, CI/CD, Linux, and cloud infrastructure.\nGeospatial, civic, and research-adjacent systems when maps, sensors, or structured field data matter.',
    what_i_work_well_on_ja: '実運用上の制約があるプロダクトに対するバックエンド / プラットフォーム開発。\nAPI、認証、データワークフロー、CI/CD、Linux、クラウド基盤。\n地図、センサー、構造化フィールドデータが重要な地理空間・シビック・リサーチ隣接のシステム。'
  },
  contact: {
    intro_en: 'Reach out about backend/platform engineering roles, shipped product work, or research-adjacent systems.',
    intro_ja: 'バックエンド / プラットフォーム領域の採用、実運用プロダクト、またはリサーチ隣接システムについてご連絡ください。',
    availability_en: 'Typically responds within 1-2 business days.',
    availability_ja: '通常 1-2 営業日以内に返信します。'
  },
  resume: {
    url_en: 'https://example.com/resume-en.pdf',
    url_ja: 'https://example.com/resume-ja.pdf',
    updatedAt: '2026-03-19'
  }
}

const mockProjects = [
  {
    id: 'crowdpm-platform',
    title_en: 'CrowdPM Platform',
    title_ja: 'CrowdPM Platform',
    description_en: 'Crowd-sourced PM2.5 monitoring platform with secure ingest, calibrated storage, and a WebGL map client.',
    description_ja: 'セキュアな ingest、校正済み保存、WebGL マップクライアントを備えた crowd-sourced PM2.5 監視基盤。',
    problem_en: 'Crowd-sourced PM2.5 monitoring needs a secure ingest path, calibrated storage, and a map that turns sensor batches into something operators can use.',
    problem_ja: 'crowd-sourced PM2.5 監視では、セキュアな ingest、校正済み保存、そしてセンサーバッチを運用画面に変える地図 UI が必要になる。',
    owned_en: 'Led platform architecture across secure ingest, calibrated processing, API design, deployment workflow, and the React mapping surface.',
    owned_ja: 'セキュアな ingest、校正済み処理、API 設計、デプロイワークフロー、React ベースの地図 UI まで、プラットフォーム設計を主導。',
    architecture_en: 'Firebase Cloud Functions, Fastify, Cloud Storage, Firestore hourly buckets, DPoP-bound ingest, React 19, deck.gl, Google Maps WebGL, GitHub Actions.',
    architecture_ja: 'Firebase Cloud Functions、Fastify、Cloud Storage、Firestore の hourly bucket、DPoP 連携 ingest、React 19、deck.gl、Google Maps WebGL、GitHub Actions。',
    result_en: 'Live demo deployment with documented device activation, MFA approval, partner-facing API routes, and an end-to-end data path from sensor payloads to map layers.',
    result_ja: 'デバイス有効化、MFA 承認、外部向け API、センサーペイロードから地図レイヤーまでの end-to-end パイプラインを備えた live demo を公開。',
    url: 'https://crowdpmplatform.web.app',
    repo: 'https://github.com/Denuo-Web/CrowdPMPlatform',
    order: 1,
    tags_en: ['TypeScript', 'Fastify', 'Firestore', 'deck.gl'],
    tags_ja: ['TypeScript', 'Fastify', 'Firestore', 'deck.gl'],
    cover: 'https://opengraph.githubassets.com/1/Denuo-Web/CrowdPMPlatform',
    github_full_name: 'Denuo-Web/CrowdPMPlatform'
  },
  {
    id: 'quest-by-cycle',
    title_en: 'QuestByCycle',
    title_ja: 'QuestByCycle',
    description_en: 'Gamified bicycling platform that combines missions, proof submission, badges, and leaderboards.',
    description_ja: 'ミッション、証跡投稿、バッジ、リーダーボードを組み合わせた gamified bicycling platform。',
    problem_en: 'Cycling communities needed a product that could turn missions, proof submission, badges, and leaderboards into sustained participation.',
    problem_ja: 'サイクリングコミュニティには、ミッション、証跡投稿、バッジ、リーダーボードを継続参加につなげるプロダクトが必要だった。',
    owned_en: 'Built and operated the web product end-to-end, including backend services, background jobs, data model, frontend delivery, and production provisioning.',
    owned_ja: 'バックエンド、バックグラウンドジョブ、データモデル、フロントエンド、本番基盤まで、プロダクトを end-to-end で構築・運用。',
    architecture_en: 'Flask, PostgreSQL, SQLAlchemy, Redis/RQ workers, Vite frontend, Gunicorn, NGINX, Poetry, pytest, Terraform, Ansible.',
    architecture_ja: 'Flask、PostgreSQL、SQLAlchemy、Redis / RQ ワーカー、Vite フロントエンド、Gunicorn、NGINX、Poetry、pytest、Terraform、Ansible。',
    result_en: 'Live at questbycycle.org with production infrastructure, background processing, and user-facing features spanning leaderboards, PWA flows, and notifications.',
    result_ja: 'questbycycle.org で live 運用されており、本番基盤、バックグラウンド処理、リーダーボード、PWA、通知などの機能を提供。',
    url: 'https://questbycycle.org',
    repo: 'https://github.com/Denuo-Web/QuestByCycle',
    order: 2,
    tags_en: ['Python', 'Flask', 'PostgreSQL', 'Redis'],
    tags_ja: ['Python', 'Flask', 'PostgreSQL', 'Redis'],
    cover: 'https://opengraph.githubassets.com/1/Denuo-Web/QuestByCycle',
    github_full_name: 'Denuo-Web/QuestByCycle'
  },
  {
    id: 'arm64-adk',
    title_en: 'ARM64-ADK',
    title_ja: 'ARM64-ADK',
    description_en: 'Multi-service Android development toolkit for Linux ARM64 with GUI, CLI, and packaged releases.',
    description_ja: 'GUI、CLI、パッケージ配布を備えた Linux ARM64 向けの multi-service Android 開発ツールキット。',
    problem_en: 'Android development on Linux ARM64 still lacks first-class tooling when teams need packaging, workflows, and observability instead of ad hoc scripts.',
    problem_ja: 'Linux ARM64 上の Android 開発では、場当たり的なスクリプトではなく、パッケージング、ワークフロー、可観測性を備えたツールが不足している。',
    owned_en: 'Built the toolkit platform directly, shipping the service architecture, GTK UI, CLI, release packaging, and workflow around toolchains and builds.',
    owned_ja: 'サービス構成、GTK UI、CLI、リリースパッケージング、toolchain と build のワークフローを含めて、ツールキット基盤を直接構築。',
    architecture_en: 'Rust workspace with 12 crates, gRPC services, GTK4 UI, CLI client, JobService event bus, workflow/build/observe services, packaged Linux ARM64 releases.',
    architecture_ja: '12 クレートの Rust workspace、gRPC サービス、GTK4 UI、CLI、JobService event bus、workflow/build/observe サービス、Linux ARM64 向けパッケージ配布。',
    result_en: 'Public v0.1.0 release with .deb and .tar.gz artifacts, a repo-hosted UI demo, and a focused open-source platform for Linux ARM64 Android development.',
    result_ja: '.deb と .tar.gz の公開リリース、repo 上の UI デモ、Linux ARM64 向け Android 開発基盤としてのオープンソース成果物を提供。',
    repo: 'https://github.com/denuoweb/ARM64-ADK',
    order: 3,
    tags_en: ['Rust', 'gRPC', 'GTK4', 'ARM64'],
    tags_ja: ['Rust', 'gRPC', 'GTK4', 'ARM64'],
    cover: 'https://opengraph.githubassets.com/1/denuoweb/ARM64-ADK',
    github_full_name: 'denuoweb/ARM64-ADK'
  },
  {
    id: 'drip-copy',
    title_en: 'DripCopy',
    title_ja: 'DripCopy',
    description_en: 'Fault-tolerant optical-media copier for low-power USB hosts.',
    description_ja: '低電力 USB ホスト向けの fault-tolerant optical media copier。',
    problem_en: 'Copying optical media on low-power USB hosts can brown out the drive, reset the bus, and corrupt long-running transfers.',
    problem_ja: '低電力 USB ホストで光学メディアをコピーすると、電圧低下でドライブや USB バスがリセットされ、長時間の転送が壊れやすい。',
    owned_en: 'Built the recovery-focused utility and the operational logic around retries, remounts, resumable output, and logging.',
    owned_ja: 'リトライ、再マウント、再開可能な出力、ログ収集を含む、復旧重視のユーティリティを実装。',
    architecture_en: 'Bash utility with pv rate limiting, atomic writes, retry/remount handling, path de-duplication, and structured logs.',
    architecture_ja: 'pv による速度制限、atomic write、retry/remount、パス重複排除、構造化ログを備えた Bash ユーティリティ。',
    result_en: 'Turns a flaky hardware problem into a reproducible Linux workflow for extracting files when standard copy tools or whole-disc imaging are too brittle.',
    result_ja: '標準コピーやディスク丸ごとイメージ化が不安定な状況でも、ファイル抽出を再現可能な Linux ワークフローに変える。',
    repo: 'https://github.com/Denuo-Web/DripCopy',
    order: 4,
    tags_en: ['Bash', 'Linux', 'Recovery', 'USB'],
    tags_ja: ['Bash', 'Linux', 'Recovery', 'USB'],
    cover: 'https://opengraph.githubassets.com/1/Denuo-Web/DripCopy',
    github_full_name: 'Denuo-Web/DripCopy'
  }
]

const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''

const pickArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map(item => pick(item)).filter(Boolean)
    : []

function normalizeLocalizedText(item: Record<string, unknown>, prefix: string, fallback?: string): LocalizedText {
  return {
    en: pick(item[`${prefix}_en`] ?? item[prefix] ?? fallback),
    ja: pick(item[`${prefix}_ja`] ?? fallback)
  }
}

export function normalizeProjectRecord(raw: Record<string, unknown>): ProjectRecord {
  const url = pick(raw.url)
  const repo = pick(raw.repo ?? raw.source ?? raw.github)
  const cover = pick(raw.cover ?? raw.image ?? raw.thumbnail)

  return {
    id: String(raw.id ?? ''),
    title: normalizeLocalizedText(raw, 'title'),
    description: normalizeLocalizedText(raw, 'description'),
    problem: normalizeLocalizedText(raw, 'problem'),
    owned: normalizeLocalizedText(raw, 'owned'),
    architecture: normalizeLocalizedText(raw, 'architecture'),
    result: normalizeLocalizedText(raw, 'result'),
    impact: normalizeLocalizedText(raw, 'impact'),
    url: url || undefined,
    repo: repo || undefined,
    tags: {
      en: pickArray(raw.tags_en ?? raw.tags),
      ja: pickArray(raw.tags_ja)
    },
    cover: cover || undefined,
    githubFullName: pick(raw.github_full_name),
    githubOwner: pick(raw.github_owner),
    githubRepo: pick(raw.github_repo),
    githubUpdatedAt: pick(raw.github_updated_at),
    githubPushedAt: pick(raw.github_pushed_at)
  }
}

export async function getPublicDoc(id: string) {
  if (useMockData) {
    return mockDocs[id] ?? null
  }
  const snap = await getDoc(doc(db, 'public', id))
  return snap.exists() ? snap.data() : null
}

export async function listProjects(): Promise<ProjectRecord[]> {
  if (useMockData) {
    return mockProjects.map(item => normalizeProjectRecord(item))
  }
  const q = query(collection(db, 'projects'), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => normalizeProjectRecord({ id: d.id, ...d.data() }))
}
