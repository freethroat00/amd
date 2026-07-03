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

export const Dashboard: React.FC<DashboardProps> = ({ profile, onBack }) => {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: monthsData } = await supabase.from('months').select('*');

    if (!profiles || !monthsData) {
      setLoading(false);
      return;
    }

    const stats: UserStats[] = profiles.map(p => {
      const userMonths = monthsData.filter(m => m.user_id === p.id);
      let totalSalary = 0;
      let totalWorkDays = 0;

      userMonths.forEach(m => {
        const monthData: MonthData = { year: m.year, month: m.month, days: m.data };
        const stats = calculateMonthStats(monthData);
        totalSalary += stats.totalSalary;
        totalWorkDays += stats.workDays;
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
    setLoading(false);
  };

  const grandTotal = users.reduce((sum, u) => sum + u.totalSalary, 0);

  return (
    <div className="dashboard">
      <div className="dash-header">
        <button className="dash-back" onClick={onBack}>{'< назад'}</button>
        <div className="dash-title">дашборд</div>
        <div className="dash-role">{profile.role}</div>
      </div>

      <div className="dash-total-card">
        <div className="dash-total-label">общий заработок</div>
        <div className="dash-total-val">{grandTotal.toFixed(0)} <span className="dash-total-cur">BYN</span></div>
        <div className="dash-total-users">{users.length} пользователей</div>
      </div>

      {loading ? (
        <div className="dash-loading">загрузка...</div>
      ) : (
        <div className="dash-users">
          {users.map((u, i) => (
            <div key={u.email} className="dash-user-card">
              <div className="dash-user-rank">#{i + 1}</div>
              <div className="dash-user-info">
                <div className="dash-user-name">{u.name}</div>
                <div className="dash-user-email">{u.email}</div>
              </div>
              <div className="dash-user-stats">
                <div className="dash-user-salary">{u.totalSalary.toFixed(0)} BYN</div>
                <div className="dash-user-days">{u.workDays} дней · {u.months} мес.</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
