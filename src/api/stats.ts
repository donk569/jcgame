import { rowToGame, type DbGame } from '@/api/backend';
import { supabase } from '@/api/supabase';

export type GameActivity = 'play' | 'download';
export type ActivityDay = { date: string; plays: number; downloads: number };
export type CreatorStats = {
  plays: number;
  downloads: number;
  collections: number;
  trend: ActivityDay[];
};

const VIEWER_KEY = 'jcgame:activity-viewer';
let sessionViewer: string | undefined;

function getViewer() {
  if (sessionViewer) return sessionViewer;
  try {
    const viewer = sessionStorage.getItem(VIEWER_KEY);
    if (viewer && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(viewer)) {
      sessionViewer = viewer;
      return viewer;
    }
    sessionViewer = crypto.randomUUID();
    sessionStorage.setItem(VIEWER_KEY, sessionViewer);
    return sessionViewer;
  } catch {
    return sessionViewer ??= crypto.randomUUID();
  }
}

export async function recordGameActivity(slug: string, kind: GameActivity): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.rpc('record_game_activity', {
      p_slug: slug,
      p_kind: kind,
      p_viewer: getViewer(),
    });
  } catch {
    // Telemetry must never affect playback or download.
  }
}

export async function fetchCreatorStats(signal: AbortSignal): Promise<CreatorStats> {
  if (!supabase) throw new Error('后台数据服务不可用');
  const { data, error } = await supabase.rpc('creator_game_stats').abortSignal(signal);
  if (error) throw error;
  return data as CreatorStats;
}

export async function fetchApprovedWorks(owner: string, signal: AbortSignal) {
  if (!supabase) return [];
  const client = supabase;
  const games = [];
  const batchSize = 100;
  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await client.from('games')
      .select('*')
      .eq('owner', owner)
      .eq('review_state', 'approved')
      .order('released_at', { ascending: false })
      .order('slug')
      .range(offset, offset + batchSize - 1)
      .abortSignal(signal);
    if (error) throw error;
    games.push(...(data as DbGame[]).map(rowToGame));
    if (data.length < batchSize) return games;
  }
}
