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
    footerNote: 'Implementation and integration case studies.',
    contactEmail: 'jaron@rosenau.info',
    github_url: 'https://github.com/denuoweb',
    linkedin_url: 'https://www.linkedin.com/in/jaronrosenau'
  },
  home: {
    headline_en: 'Implementation / Developer Support Engineer',
    headline_ja: '実装 / 開発者サポートエンジニア',
    supporting_en: 'I build, integrate, debug, document, deploy, and support API-driven web systems across Python, TypeScript, Firebase, Cloud Run, PostgreSQL, Linux, and CI/CD.',
    supporting_ja: 'Python、TypeScript、Firebase、Cloud Run、PostgreSQL、Linux、CI/CD を使い、API 駆動の Web システムを構築、連携、デバッグ、文書化、デプロイ、サポートします。',
    featured_project_ids: ['quest-by-cycle', 'moonshine-art', 'crowdpm-platform'],
    links_en: 'Resume | /resume\nCase Studies | /projects\nGitHub | https://github.com/denuoweb\nLinkedIn | https://www.linkedin.com/in/jaronrosenau\nContact | /contact',
    links_ja: '履歴書 | /resume\n事例 | /projects\nGitHub | https://github.com/denuoweb\nLinkedIn | https://www.linkedin.com/in/jaronrosenau\n連絡先 | /contact'
  },
  about: {
    headline_en: 'Implementation / Developer Support Engineer',
    headline_ja: '実装 / 開発者サポートエンジニア',
    intro_en: 'I work on implementation and developer-support problems where requirements, APIs, auth, operations, documentation, and production support all need to line up.',
    intro_ja: '要件、API、認証、運用、本番サポートを一つの delivery としてそろえる必要がある、複雑な実装案件で力を発揮します。'
  },
  contact: {
    intro_en: 'Open to Implementation Engineer, Developer Support Engineer, Technical Support Engineer, Integration Engineer, Solutions Engineer, Support Engineer, and technical operations roles.',
    intro_ja: '実装エンジニア、開発者サポートエンジニア、技術サポート、連携エンジニア、ソリューション寄りの技術職、技術運用職に関心があります。',
    availability_en: 'Available immediately for part-time or contract work; full-time after June 2026.',
    availability_ja: 'パートタイム / 契約はすぐ対応可能。フルタイムは 2026 年 6 月以降。'
  },
  resume: {
    url_en: '/Jaron_Rosenau_Resume.pdf',
    url_ja: '/Jaron_Rosenau_Resume.pdf',
    updatedAt: '2026-05-01'
  }
}

const mockProjects = [
  {
    id: 'moonshine-art',
    title_en: 'Moonshine Art',
    title_ja: 'Moonshine Art',
    description_en: 'Private marketplace implementation case study covering seller onboarding, checkout, fulfillment, moderation, support, and compliance workflows.',
    description_ja: '出品者登録、購入、発送、モデレーション、サポート、コンプライアンスを含む非公開マーケットプレイス実装のケーススタディ。',
    problem_en: 'A private art marketplace needed buyer checkout, seller onboarding, fulfillment, admin/support workflows, and compliance surfaces to behave as one supportable system.',
    problem_ja: '非公開のアートマーケットプレイスでは、購入、出品者登録、発送、管理 / サポート、コンプライアンスを一つの保守可能なシステムとしてつなぐ必要があった。',
    owned_en: 'Designed and built the implementation architecture across Flutter web, Firebase/Firestore, Cloud Run APIs, Stripe Connect, Gelato fulfillment, moderation/admin tooling, and support workflows.',
    owned_ja: 'Flutter Web、Firebase / Firestore、Cloud Run API、Stripe Connect、Gelato 発送、モデレーション / 管理ツール、サポートワークフローを横断して設計・実装。',
    architecture_en: 'Flutter web client, Firebase/Firestore data model, Stripe Connect onboarding, checkout/webhook service, Gelato print fulfillment adapter, Firebase moderation functions, and support/admin routes.',
    architecture_ja: 'Flutter Web クライアント、Firebase / Firestore データモデル、Stripe Connect 登録、購入 / Webhook サービス、Gelato print fulfillment adapter、Firebase moderation functions、サポート / 管理ルート。',
    result_en: 'Created a sanitized public case study while keeping source private, with operational documentation for local development, deployment, support, and compliance handoff.',
    result_ja: 'ソースコードは非公開のまま、公開用のケーススタディと、ローカル開発、デプロイ、サポート、コンプライアンス引き継ぎ用の運用ドキュメントを整備。',
    url: 'https://denuoweb.com/work/moonshine-art',
    repo: 'https://github.com/Denuo-Web/moonshine-art-case-study',
    order: 1,
    tags_en: ['Flutter', 'Firebase', 'Cloud Run', 'Stripe', 'Firestore'],
    tags_ja: ['Flutter', 'Firebase', 'Cloud Run', 'Stripe', 'Firestore'],
    cover: 'https://opengraph.githubassets.com/1/Denuo-Web/moonshine-art-case-study',
    github_full_name: 'Denuo-Web/moonshine-art-case-study'
  },
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
    order: 3,
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
    id: 'apk-workbench',
    title_en: 'APK Workbench',
    title_ja: 'APK Workbench',
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
    repo: 'https://github.com/Denuo-Web/APK-Workbench',
    order: 4,
    tags_en: ['Rust', 'gRPC', 'GTK4', 'ARM64'],
    tags_ja: ['Rust', 'gRPC', 'GTK4', 'ARM64'],
    cover: 'https://opengraph.githubassets.com/1/Denuo-Web/APK-Workbench',
    github_full_name: 'Denuo-Web/APK-Workbench'
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
    order: 5,
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
