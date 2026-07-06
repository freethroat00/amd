import { useState, useEffect, useRef, useMemo } from 'react';
import type { MonthData, WorkRate } from '../../types';
import { Calendar } from '../Calendar/Calendar';
import { RateSelector } from '../RateSelector/RateSelector';
import { MonthSummary } from '../MonthSummary/MonthSummary';
import { calculateMonthStats } from '../../utils/salaryCalculations';
import { DEFAULT_RATE_CONFIG } from '../../types';
import './SalaryCalculator.css';

interface SalaryCalculatorProps {
  monthData: MonthData;
  currentYear: number;
  currentMonth: number;
  onUpdateRates: (date: string, rates: WorkRate[]) => void;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  businessTripSubtracted: boolean;
  onToggleBusinessTrip: () => void;
}

export const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({
  monthData, currentYear, currentMonth,
  onUpdateRates, onNavigateMonth, businessTripSubtracted, onToggleBusinessTrip
}) => {
  const [showRateSelector, setShowRateSelector] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [displayValue, setDisplayValue] = useState(0);
  const [mileageSubtracted, setMileageSubtracted] = useState(false);
  const animRef = useRef<number>(0);

  const handleSelectRates = (date: string) => {
    setSelectedDate(date);
    setShowRateSelector(true);
  };

  const selectedDay = monthData.days.find(d => d.date === selectedDate);
  const stats = calculateMonthStats(monthData);

  const businessTripTotal = useMemo(() => {
    let total = 0;
    monthData.days.forEach(day => {
      day.rates.forEach(rate => {
        if (rate.type === 'region' && rate.regionDetails?.hasBusinessTrip) {
          total += DEFAULT_RATE_CONFIG.businessTrip;
        }
      });
    });
    return total;
  }, [monthData]);

  const mileageTotal = useMemo(() => {
    let totalKm = 0;
    monthData.days.forEach(day => {
      day.rates.forEach(rate => {
        if (rate.type === 'region' && rate.regionDetails) {
          totalKm += rate.regionDetails.mileage || 0;
        }
      });
    });
    return Math.round(Math.max(0, totalKm - 700) * 0.1 * 10) / 10;
  }, [monthData]);

  const targetSalary = stats.totalSalary
    - (businessTripSubtracted ? businessTripTotal : 0)
    - (mileageSubtracted ? mileageTotal : 0);

  useEffect(() => {
    const target = targetSalary;
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
  }, [targetSalary]);

  return (
    <div className="sc">
      <div className="sc-total">
        <div className="sc-total-row">
          <div className={'sc-total-val' + (targetSalary === 0 ? ' sc-zero' : ' sc-active')}>
            {displayValue}
          </div>
          <div className="sc-total-cur">BYN</div>
        </div>
        <div className="sc-total-days">{stats.workDays} рабочих дней</div>
      </div>

      <MonthSummary
        monthData={monthData}
        businessTripSubtracted={businessTripSubtracted}
        onToggleBusinessTrip={onToggleBusinessTrip}
        mileageSubtracted={mileageSubtracted}
        onToggleMileage={() => setMileageSubtracted(p => !p)}
      />

      <Calendar
        monthData={monthData}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onSelectRates={handleSelectRates}
        onNavigateMonth={onNavigateMonth}
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
