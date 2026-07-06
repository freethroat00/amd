import { useState, useMemo, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useRemoteData } from './hooks/useRemoteData';
import { useTheme } from './hooks/useTheme';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { SalaryCalculator } from './components/SalaryCalculator/SalaryCalculator';
import { Notes } from './components/Notes/Notes';
import { createDefaultMonthData } from './utils/salaryCalculations';
import { trackEvent } from './utils/analytics';
import type { MonthData, WorkRate } from './types';
import './App.css';

function App() {
  const { user, profile, loading, anonymousSignIn } = useAuth();
  const { months, notes, loading: dataLoading, saveMonth, addNote, removeNote } = useRemoteData(user?.id ?? null);
  const { toggle: toggleTheme } = useTheme();
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [businessTripSubtracted, setBusinessTripSubtracted] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthData = useMemo((): MonthData => {
    const found = months.find(m => m.year === currentYear && m.month === currentMonth);
    if (found) return found;
    return createDefaultMonthData(currentYear, currentMonth);
  }, [months, currentYear, currentMonth]);

  const updateRates = useCallback((date: string, rates: WorkRate[]) => {
    const updated = { ...monthData };
    const dayIndex = updated.days.findIndex(d => d.date === date);
    if (dayIndex !== -1) {
      updated.days = [...updated.days];
      updated.days[dayIndex] = { ...updated.days[dayIndex], rates };
      saveMonth(updated.year, updated.month, updated.days);
      trackEvent('rate_change', { date, rates: rates.map(r => r.type) }, user?.id);
    }
  }, [monthData, saveMonth, user?.id]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
      return d;
    });
  };

  if (loading || dataLoading) {
    return (
      <div className="App">
        <div className="App-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-dim)', fontWeight: 600 }}>загрузка...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onAnonymousSignIn={anonymousSignIn} />;
  }

  if (showDashboard && profile?.role === 'admin') {
    return <Dashboard profile={profile} onBack={() => setShowDashboard(false)} />;
  }

  return (
    <div className="App">
      <main className="App-main">
        <div className="user-bar">
          <div className="user-name">{profile?.name || 'гость'}</div>
          <div className="user-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb" />
              </span>
            </button>
            {profile?.role === 'admin' && (
              <button className="user-action" onClick={() => setShowDashboard(true)}>дашборд</button>
            )}
          </div>
        </div>
        <SalaryCalculator
          monthData={monthData}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onUpdateRates={updateRates}
          onNavigateMonth={navigateMonth}
          businessTripSubtracted={businessTripSubtracted}
          onToggleBusinessTrip={() => setBusinessTripSubtracted(p => !p)}
        />
        <Notes
          notes={notes}
          onAdd={addNote}
          onRemove={removeNote}
        />
      </main>
    </div>
  );
}

export default App;
