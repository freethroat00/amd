import { useState, useEffect } from 'react';
import type { Profile } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { calculateMonthStats, RATE_COLORS } from '../utils/salaryCalculations';
import { Calendar } from '../components/Calendar/Calendar';
import { MonthSummary } from '../components/MonthSummary/MonthSummary';
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

export const Dashboard: React.FC<DashboardProps> = ({ profile, onBack }) => {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [userMonths, setUserMonths] = useState<MonthData[]>([]);
  const [userCalendarDate, setUserCalendarDate] = useState(new Date());
  const [loadingUserCalendar, setLoadingUserCalendar] = useState(false);
  const [userBusinessTrip, setUserBusinessTrip] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const [profilesRes, monthsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('months').select('*')
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
    }

    setLoading(false);
  };

  const loadUserCalendar = async (user: UserStats) => {
    setSelectedUser(user);
    setLoadingUserCalendar(true);
    setUserCalendarDate(new Date());
    setUserBusinessTrip(false);

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
              showDetails
              onNavigateMonth={(dir) => {
                setUserCalendarDate(prev => {
                  const d = new Date(prev);
                  d.setMonth(d.getMonth() + (dir === 'next' ? 1 : -1));
                  return d;
                });
              }}
            />

            <MonthSummary
              monthData={userMonthData}
              businessTripSubtracted={userBusinessTrip}
              onToggleBusinessTrip={() => setUserBusinessTrip(p => !p)}
            />
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

      {loading ? (
        <div className="dash-loading">загрузка...</div>
      ) : (
        <>
          <div className="dash-section-title">пользователи</div>
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
            {users.length === 0 && (
              <div className="dash-empty">пока нет пользователей</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
