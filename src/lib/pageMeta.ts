import { useEffect } from 'react';

const DEFAULT_TITLE = 'JCGame — 开放式独立游戏平台';
const DEFAULT_DESCRIPTION =
  'JCGame 是一个开放式独立游戏平台：Unity、Unreal、Godot、Cocos、H5 都能发布，网页直接试玩或下载客户端。';
const DEFAULT_IMAGE = '/art/keyart/neon-drift-keyart.webp';

interface PageMeta {
  title?: string;
  description?: string;
  image?: string;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  try {
    return new URL(value, window.location.href).href;
  } catch {
    return value;
  }
}

function apply(meta: Required<PageMeta>) {
  document.title = meta.title;
  setMeta('name', 'description', meta.description);
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:image', meta.image);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);
  setMeta('name', 'twitter:image', meta.image);
}

const defaults: Required<PageMeta> = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  image: absoluteUrl(DEFAULT_IMAGE),
};

/**
 * 按页面内容更新标题和社交分享卡片。
 * 组件卸载时恢复站点默认值，避免详情页跳走后标题残留。
 */
export function useDocumentMeta(meta: PageMeta) {
  const { title, description, image } = meta;

  useEffect(() => {
    if (title || description || image) {
      apply({
        title: title || defaults.title,
        description: description || defaults.description,
        image: image ? absoluteUrl(image) : defaults.image,
      });
    }
    return () => apply(defaults);
  }, [title, description, image]);
}
