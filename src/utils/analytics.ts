import { supabase } from '../lib/supabase';

export const trackEvent = (event: string, data: Record<string, any> = {}, userId?: string | null) => {
  if (!userId) return;
  supabase.from('analytics').insert({
    user_id: userId,
    event,
    data
  });
};
