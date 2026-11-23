import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface Submission {
  slug: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  note: string | null;
}

export interface ReviewItem extends Omit<Submission, 'note'> {
  launch_url: string | null;
  package_path: string | null;
  package_name: string | null;
  description: string[];
  cover: string;
  shots: string[];
  reasons: string[];
}

export function useCanModerate() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAllowed(session?.user.app_metadata.jcgame_moderator === true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return allowed;
}

export async function fetchMySubmissions(): Promise<Submission[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('my_submissions');
  if (error) throw error;
  return data;
}

export async function fetchReviewQueue(): Promise<ReviewItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('review_queue');
  if (error) throw error;
  return data;
}

export async function setGameReview(slug: string, status: Submission['status'], note: string) {
  if (!supabase) throw new Error('当前环境无法审核作品');
  const { error } = await supabase.rpc('set_game_review', { p_slug: slug, p_status: status, p_note: note });
  if (error) throw error;
}

export async function reportGame(slug: string, reason: string) {
  if (!supabase) throw new Error('当前环境无法提交举报');
  const { error } = await supabase.rpc('report_game', { p_slug: slug, p_reason: reason });
  if (error) throw error;
}
