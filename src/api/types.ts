/**
 * 数据契约。页面与 mock/后端之间只认这里定义的形状。
 * 接真实后端时保持字段名不变，页面代码不用动。
 */

export type RunMode = 'web' | 'download';

export interface WebBuild {
  /** 入口文件，例如 index.html */
  entry: string;
  /** 构建产物大小，字节 */
  bytes: number;
  engineVersion: string;
  /** 运行域名（隔离域），正式环境由平台分配 */
  host: string;
  launchUrl?: string;
}

export interface DownloadBuild {
  platform: 'Windows' | 'macOS' | 'Linux';
  arch: string;
  bytes: number;
  file: string;
  storagePath?: string;
  fileName?: string;
  desktopShortcut?: boolean;
  archiveFallback?: { file: string; bytes: number };
  requirements: { label: string; value: string }[];
}

export interface Game {
  slug: string;
  title: string;
  titleCn: string;
  tagline: string;
  description: string[];
  studio: { name: string; handle: string };
  engine: string;
  engineVersion: string;
  categories: string[];
  tags: string[];
  runMode: RunMode;
  platforms: string[];
  version: string;
  updatedAt: string;
  releasedAt: string;
  plays: number;
  likes: number;
  price: 'free' | 'paid';
  cover: string;
  keyart?: string;
  shots?: string[];
  webBuild?: WebBuild;
  download?: DownloadBuild;
  changelog?: { version: string; date: string; notes: string[] }[];
  featured?: boolean;
}

export interface Creator {
  handle: string;
  name: string;
  bio: string;
  followers: number;
  since: string;
  location: string;
  links: { label: string; url: string }[];
  accent: string;
}

export interface Category {
  slug: string;
  name: string;
  desc: string;
  count: number;
  color: string;
  preview: string;
}

export interface EngineOption {
  name: string;
  count: number;
}

export interface RunModeOption {
  value: RunMode;
  label: string;
  desc: string;
}

export type EngineBuildGuide = Record<string, { web?: string; download?: string }>;

export interface CurrentUser {
  handle: string;
  name: string;
  email: string;
  bio: string;
  joined: string;
}

/* ------------------------------------------------------------------ */
/* 用户侧实体（原本放在 store 里，类型统一收敛到这里）                */
/* ------------------------------------------------------------------ */

export interface DraftForm {
  title: string;
  titleEn: string;
  tagline: string;
  developer: string;
  cats: string[];
  tags: string[];
  coverName: string;
  shotNames: string[];
  runMode: 'web' | 'download';
  launchUrl?: string;
  engine: string;
  engineOther: string;
  version: string;
  changelog: string;
  savedAt: string;
}

export interface Draft {
  id: string;
  form: DraftForm;
  progress: number;
}

export interface Comment {
  id: string;
  name: string;
  text: string;
  time: string;
  target: string;
  unread: boolean;
  reply?: string;
}

export interface Profile {
  name: string;
  bio: string;
  site: string;
}
