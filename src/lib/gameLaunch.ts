export function getGameLaunchUrl(value: string | undefined, appOrigin: string): URL | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const app = new URL(appOrigin);
    if (url.protocol !== 'https:' || url.username || url.password || url.hostname === app.hostname) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}
