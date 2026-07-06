import { useState, useEffect } from 'react';
import type { Profile } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { calculateMonthStats } from '../utils/salaryCalculations';
import type { MonthData } from '../types';
import './Dashboard.css';

interface DashboardProps {
  profile: Profile;
  onBack: () => void;
}

interface UserStats {
  name: string;
  email: string;
  totalSalary: number;
  workDays: number;
  months: number;
}

interface AnalyticsEvent {
  id: string;
  user_id: string;
  event: string;
  data: any;
  created_at: string;
  profiles?: { name: string } | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, onBack }) => {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const [profilesRes, monthsRes, analyticsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('months').select('*'),
      supabase.from('analytics').select('*, profiles(name)').order('created_at', { ascending: false }).limit(30)
    ]);

    const profiles = profilesRes.data;
    const monthsData = monthsRes.data;

    if (profiles && monthsData) {
      const stats: UserStats[] = profiles.map(p => {
        const userMonths = monthsData.filter(m => m.user_id === p.id);
        let totalSalary = 0;
        let totalWorkDays = 0;

        userMonths.forEach(m => {
          const monthData: MonthData = { year: m.year, month: m.month, days: m.data };
          const s = calculateMonthStats(monthData);
          totalSalary += s.totalSalary;
          totalWorkDays += s.workDays;
        });

        return {
          name: p.name || p.email.split('@')[0],
          email: p.email,
          totalSalary,
          workDays: totalWorkDays,
          months: userMonths.length
        };
      });

      setUsers(stats.sort((a, b) => b.totalSalary - a.totalSalary));
    }

    if (analyticsRes.data) {
      setEvents(analyticsRes.data);

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const active = new Set(
        analyticsRes.data
          .filter((e: AnalyticsEvent) => e.event === 'sign_in' && e.created_at > weekAgo)
          .map((e: AnalyticsEvent) => e.user_id)
      );
      setActiveUsers(active.size);
    }

    setLoading(false);
  };

  const grandTotal = users.reduce((sum, u) => sum + u.totalSalary, 0);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' ' +
           d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const eventLabels: Record<string, string> = {
    sign_in: 'Вход',
    rate_change: 'Смена'
  };

  return (
    <div className="dashboard">
      <div className="dash-header">
        <button className="dash-back" onClick={onBack}>{'< назад'}</button>
        <div className="dash-title">дашборд</div>
        <div className="dash-role">{profile.role}</div>
      </div>

      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="dash-stat-val">{grandTotal.toFixed(0)}</div>
          <div className="dash-stat-label">BYN всего</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-val">{users.length}</div>
          <div className="dash-stat-label">пользователей</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-val">{activeUsers}</div>
          <div className="dash-stat-label">активных (7д)</div>
        </div>
      </div>

      {loading ? (
        <div className="dash-loading">загрузка...</div>
      ) : (
        <>
          <div className="dash-section-title">пользователи</div>
          <div className="dash-users">
            {users.map((u, i) => (
              <div key={u.email} className="dash-user-card">
                <div className="dash-user-rank">#{i + 1}</div>
                <div className="dash-user-info">
                  <div className="dash-user-name">{u.name}</div>
                  <div className="dash-user-days">{u.workDays} дней · {u.months} мес.</div>
                </div>
                <div className="dash-user-salary">{u.totalSalary.toFixed(0)} BYN</div>
              </div>
            ))}
          </div>

          <div className="dash-section-title">активность</div>
          <div className="dash-events">
            {events.map(e => (
              <div key={e.id} className="dash-event">
                <div className="dash-event-icon">{e.event === 'sign_in' ? '→' : '↻'}</div>
                <div className="dash-event-info">
                  <div className="dash-event-text">
                    <span className="dash-event-user">{e.profiles?.name || 'user'}</span>
                    {' '}{eventLabels[e.event] || e.event}
                    {e.event === 'rate_change' && e.data?.rates && (
                      <span className="dash-event-detail"> → {e.data.rates.join(', ')}</span>
                    )}
                  </div>
                  <div className="dash-event-time">{formatTime(e.created_at)}</div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="dash-empty">пока нет событий</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
