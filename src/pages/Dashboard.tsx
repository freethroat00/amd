import { useState, useEffect } from 'react';
import type { Profile } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { calculateMonthStats, RATE_LABELS, RATE_COLORS } from '../utils/salaryCalculations';
import { Calendar } from '../components/Calendar/Calendar';
import type { MonthData, RateType } from '../types';
import './Dashboard.css';

interface DashboardProps {
  profile: Profile;
  onBack: () => void;
}

interface UserStats {
  id: string;
  name: string;
  email: string;
  totalSalary: number;
  workDays: number;
  months: number;
  rateBreakdown: Record<RateType, number>;
}

interface MonthTrend {
  label: string;
  salary: number;
  days: number;
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
  const [monthTrend, setMonthTrend] = useState<MonthTrend[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [userMonths, setUserMonths] = useState<MonthData[]>([]);
  const [userCalendarDate, setUserCalendarDate] = useState(new Date());
  const [loadingUserCalendar, setLoadingUserCalendar] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const [profilesRes, monthsRes, analyticsRes, notesRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('months').select('*'),
      supabase.from('analytics').select('*, profiles(name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('notes').select('id')
    ]);

    const profiles = profilesRes.data;
    const monthsData = monthsRes.data;

    if (profiles && monthsData) {
      const stats: UserStats[] = profiles.map(p => {
        const userMonthsData = monthsData.filter(m => m.user_id === p.id);
        let totalSalary = 0;
        let totalWorkDays = 0;
        const rateBreakdown: Record<RateType, number> = { pzv: 0, kbt: 0, region: 0, loading: 0, carwash: 0, errands: 0 };

        userMonthsData.forEach(m => {
          const monthData: MonthData = { year: m.year, month: m.month, days: m.data };
          const s = calculateMonthStats(monthData);
          totalSalary += s.totalSalary;
          totalWorkDays += s.workDays;

          m.data.forEach((day: any) => {
            day.rates?.forEach((rate: any) => {
              rateBreakdown[rate.type as RateType] = (rateBreakdown[rate.type as RateType] || 0) + 1;
            });
          });
        });

        return {
          id: p.id,
          name: p.name || p.email.split('@')[0],
          email: p.email,
          totalSalary,
          workDays: totalWorkDays,
          months: userMonthsData.length,
          rateBreakdown
        };
      });

      setUsers(stats.sort((a, b) => b.totalSalary - a.totalSalary));

      const trendMap = new Map<string, { salary: number; days: number }>();
      monthsData.forEach(m => {
        const monthData: MonthData = { year: m.year, month: m.month, days: m.data };
        const s = calculateMonthStats(monthData);
        const key = `${m.year}-${m.month}`;
        const existing = trendMap.get(key) || { salary: 0, days: 0 };
        trendMap.set(key, { salary: existing.salary + s.totalSalary, days: existing.days + s.workDays });
      });

      const MN = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
      const trend: MonthTrend[] = [];
      trendMap.forEach((val, key) => {
        const [y, m] = key.split('-').map(Number);
        trend.push({ label: MN[m] + ' ' + String(y).slice(2), salary: val.salary, days: val.days });
      });
      setMonthTrend(trend.sort((a, b) => a.label.localeCompare(b.label)).slice(-6));
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

    if (notesRes.data) {
      setTotalNotes(notesRes.data.length);
    }

    setLoading(false);
  };

  const loadUserCalendar = async (user: UserStats) => {
    setSelectedUser(user);
    setLoadingUserCalendar(true);
    setUserCalendarDate(new Date());

    const { data } = await supabase.from('months').select('*').eq('user_id', user.id);
    if (data) {
      setUserMonths(data.map(m => ({ year: m.year, month: m.month, days: m.data })));
    }
    setLoadingUserCalendar(false);
  };

  const userMonthData = (() => {
    if (!selectedUser) return null;
    const y = userCalendarDate.getFullYear();
    const m = userCalendarDate.getMonth();
    return userMonths.find(md => md.year === y && md.month === m) || { year: y, month: m, days: [] };
  })();

  const userMonthStats = userMonthData ? calculateMonthStats(userMonthData) : null;

  const grandTotal = users.reduce((sum, u) => sum + u.totalSalary, 0);
  const grandDays = users.reduce((sum, u) => sum + u.workDays, 0);
  const avgPerDay = grandDays > 0 ? grandTotal / grandDays : 0;

  const globalBreakdown: Record<RateType, number> = { pzv: 0, kbt: 0, region: 0, loading: 0, carwash: 0, errands: 0 };
  users.forEach(u => {
    Object.entries(u.rateBreakdown).forEach(([type, count]) => {
      globalBreakdown[type as RateType] += count;
    });
  });

  const maxTrend = Math.max(...monthTrend.map(t => t.salary), 1);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' ' +
           d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const eventLabels: Record<string, string> = {
    sign_in: 'Вход',
    rate_change: 'Смена'
  };

  const topRateTypes = (Object.entries(globalBreakdown) as [RateType, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (selectedUser && userMonthData) {
    return (
      <div className="dashboard">
        <div className="dash-header">
          <button className="dash-back" onClick={() => setSelectedUser(null)}>{'< назад'}</button>
          <div className="dash-title">{selectedUser.name}</div>
          <div className="dash-role">{selectedUser.totalSalary.toFixed(0)} BYN</div>
        </div>

        <div className="dash-user-summary">
          <span>{selectedUser.workDays} дней</span>
          <span>·</span>
          <span>{selectedUser.months} мес.</span>
        </div>

        {loadingUserCalendar ? (
          <div className="dash-loading">загрузка...</div>
        ) : (
          <>
            <Calendar
              monthData={userMonthData}
              currentYear={userCalendarDate.getFullYear()}
              currentMonth={userCalendarDate.getMonth()}
              onSelectRates={() => {}}
              onNavigateMonth={(dir) => {
                setUserCalendarDate(prev => {
                  const d = new Date(prev);
                  d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
                  return d;
                });
              }}
            />

            {userMonthStats && (
              <div className="dash-month-stats">
                <div className="dash-stat-card">
                  <div className="dash-stat-val">{userMonthStats.totalSalary}</div>
                  <div className="dash-stat-label">BYN</div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-val">{userMonthStats.workDays}</div>
                  <div className="dash-stat-label">дней</div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-val">{userMonthStats.averagePerDay.toFixed(0)}</div>
                  <div className="dash-stat-label">BYN/день</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

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
          <div className="dash-stat-val">{grandDays}</div>
          <div className="dash-stat-label">дней</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-val">{avgPerDay.toFixed(0)}</div>
          <div className="dash-stat-label">BYN/день</div>
        </div>
      </div>

      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="dash-stat-val">{users.length}</div>
          <div className="dash-stat-label">юзеров</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-val">{activeUsers}</div>
          <div className="dash-stat-label">активных (7д)</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-val">{totalNotes}</div>
          <div className="dash-stat-label">заметок</div>
        </div>
      </div>

      {loading ? (
        <div className="dash-loading">загрузка...</div>
      ) : (
        <>
          {topRateTypes.length > 0 && (
            <>
              <div className="dash-section-title">смены по типам</div>
              <div className="dash-breakdown">
                {topRateTypes.map(([type, count]) => (
                  <div key={type} className="dash-breakdown-item">
                    <div className="dash-breakdown-dot" style={{ background: RATE_COLORS[type] }} />
                    <span className="dash-breakdown-name">{RATE_LABELS[type]}</span>
                    <span className="dash-breakdown-count">{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {monthTrend.length > 1 && (
            <>
              <div className="dash-section-title">по месяцам</div>
              <div className="dash-trend">
                {monthTrend.map(t => (
                  <div key={t.label} className="dash-trend-col">
                    <div className="dash-trend-bar-wrap">
                      <div
                        className="dash-trend-bar"
                        style={{ height: `${(t.salary / maxTrend) * 100}%` }}
                      />
                    </div>
                    <div className="dash-trend-val">{t.salary.toFixed(0)}</div>
                    <div className="dash-trend-label">{t.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="dash-section-title">пользователи — нажми чтобы посмотреть календарь</div>
          <div className="dash-users">
            {users.map((u, i) => (
              <div key={u.email} className="dash-user-card" onClick={() => loadUserCalendar(u)}>
                <div className="dash-user-rank">#{i + 1}</div>
                <div className="dash-user-info">
                  <div className="dash-user-name">{u.name}</div>
                  <div className="dash-user-tags">
                    {u.rateBreakdown.pzv > 0 && <span className="dash-tag" style={{ background: RATE_COLORS.pzv + '22', color: RATE_COLORS.pzv }}>Минск {u.rateBreakdown.pzv}</span>}
                    {u.rateBreakdown.kbt > 0 && <span className="dash-tag" style={{ background: RATE_COLORS.kbt + '22', color: RATE_COLORS.kbt }}>КБТ {u.rateBreakdown.kbt}</span>}
                    {u.rateBreakdown.region > 0 && <span className="dash-tag" style={{ background: RATE_COLORS.region + '22', color: RATE_COLORS.region }}>Рег {u.rateBreakdown.region}</span>}
                  </div>
                </div>
                <div className="dash-user-stats">
                  <div className="dash-user-salary">{u.totalSalary.toFixed(0)} BYN</div>
                  <div className="dash-user-days">{u.workDays}д · {u.months}м</div>
                </div>
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
