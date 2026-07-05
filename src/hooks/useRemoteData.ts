import { useState, useEffect, useCallback } from 'react';
import type { MonthData, Note } from '../types';
import { supabase } from '../lib/supabase';

export const useRemoteData = (userId: string | null) => {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);

    const [monthsRes, notesRes] = await Promise.all([
      supabase.from('months').select('*').eq('user_id', userId),
      supabase.from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    if (monthsRes.data) {
      setMonths(monthsRes.data.map(m => ({
        year: m.year,
        month: m.month,
        days: m.data
      })));
    }

    if (notesRes.data) {
      setNotes(notesRes.data.map(n => ({
        id: n.id,
        text: n.text,
        createdAt: new Date(n.created_at).getTime()
      })));
    }

    setLoading(false);
  };

  const saveMonth = useCallback(async (year: number, month: number, days: any[]) => {
    if (!userId) return;
    const { error } = await supabase.from('months').upsert({
      user_id: userId,
      year,
      month,
      data: days,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,year,month' });
    if (!error) {
      setMonths(prev => {
        const idx = prev.findIndex(m => m.year === year && m.month === month);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { year, month, days };
          return updated;
        }
        return [...prev, { year, month, days }];
      });
    }
  }, [userId]);

  const addNote = useCallback(async (text: string) => {
    if (!userId || !text.trim()) return;
    const { data } = await supabase.from('notes').insert({
      user_id: userId,
      text: text.trim()
    }).select().single();
    if (data) {
      setNotes(prev => [{ id: data.id, text: data.text, createdAt: new Date(data.created_at).getTime() }, ...prev]);
    }
  }, [userId]);

  const removeNote = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase.from('notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [userId]);

  return { months, notes, loading, saveMonth, addNote, removeNote };
};
