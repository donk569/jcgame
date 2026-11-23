import { HAS_BACKEND, supabase } from './supabase';
import type { DownloadBuild } from './types';

const BUILD_BUCKET = 'game-builds';

export async function uploadDesktopBuild(ownerId: string, file: File): Promise<string> {
  if (!supabase || !HAS_BACKEND) throw new Error('当前环境无法托管安装包');
  const name = file.name.replace(/[^\w.-]+/g, '_');
  const path = `${ownerId}/${crypto.randomUUID()}-${name}`;
  const { error } = await supabase.storage.from(BUILD_BUCKET).upload(path, file, {
    contentType: 'application/octet-stream',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getDesktopDownloadUrl(build: DownloadBuild): Promise<string> {
  if (build.storagePath && supabase) {
    const { data, error } = await supabase.storage.from(BUILD_BUCKET).createSignedUrl(
      build.storagePath, 900, { download: build.fileName || true },
    );
    if (error) throw error;
    return data.signedUrl;
  }

  const url = new URL(build.file);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('下载地址无效');
  return url.href;
}
