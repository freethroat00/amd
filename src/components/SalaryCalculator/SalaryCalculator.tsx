import { useState, useEffect, useRef } from 'react';
import type { MonthData, WorkRate } from '../../types';
import { Calendar } from '../Calendar/Calendar';
import { RateSelector } from '../RateSelector/RateSelector';
import { calculateMonthStats } from '../../utils/salaryCalculations';
import './SalaryCalculator.css';

interface SalaryCalculatorProps {
  monthData: MonthData;
  currentYear: number;
  currentMonth: number;
  onUpdateRates: (date: string, rates: WorkRate[]) => void;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
}

export const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({
  monthData, currentYear, currentMonth,
  onUpdateRates, onNavigateMonth, onGoToToday
}) => {
  const [showRateSelector, setShowRateSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [displayValue, setDisplayValue] = useState(0);
  const animRef = useRef<number>(0);

  const handleSelectRates = (date: string) => {
    setSelectedDate(date);
    setShowRateSelector(true);
  };

  const selectedDay = monthData.days.find(d => d.date === selectedDate);
  const stats = calculateMonthStats(monthData);

  useEffect(() => {
    const target = stats.totalSalary;
    const start = displayValue;
    const diff = target - start;
    if (diff === 0) return;

    const duration = 1000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 0.5 * (1 - Math.cos(Math.PI * progress));
      setDisplayValue(Math.round(start + diff * eased));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [stats.totalSalary]);

  return (
    <div className="sc">
      <div className="sc-total">
        <div className="sc-total-row">
          <div className={'sc-total-val' + (stats.totalSalary === 0 ? ' sc-zero' : ' sc-active')}>
            {displayValue}
          </div>
          <div className="sc-total-cur">BYN</div>
        </div>
        <div className="sc-total-days">{stats.workDays} рабочих дней</div>
      </div>

      <Calendar
        monthData={monthData}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onSelectRates={handleSelectRates}
        onNavigateMonth={onNavigateMonth}
        onGoToToday={onGoToToday}
      />

      {showRateSelector && selectedDay && (
        <RateSelector
          currentRates={selectedDay.rates}
          onToggleRate={(rates) => onUpdateRates(selectedDate, rates)}
          onClose={() => setShowRateSelector(false)}
        />
      )}
    </div>
  );
};
