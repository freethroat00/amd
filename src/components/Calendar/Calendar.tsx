import type { MonthData } from '../../types';
import { DayCell } from './DayCell';
import { getDaysInMonth } from '../../utils/salaryCalculations';
import './Calendar.css';

interface CalendarProps {
  monthData: MonthData;
  currentYear: number;
  currentMonth: number;
  onSelectRates: (date: string) => void;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  showDetails?: boolean;
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const Calendar: React.FC<CalendarProps> = ({
  monthData, currentYear, currentMonth,
  onSelectRates, onNavigateMonth, showDetails
}) => {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const today = new Date();
  const todayString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  const getFirstDayOfMonth = () => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.getDay() === 0 ? 6 : d.getDay() - 1;
  };

  const renderDays = () => {
    const offset = getFirstDayOfMonth();
    const days = [];
    for (let i = 0; i < offset; i++) {
      days.push(<div key={'e' + i} className="cal-day cal-empty" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      const workDay = monthData.days.find(d => d.date === dateStr);
      const dow = new Date(currentYear, currentMonth, day).getDay();
      const isRegionDay = (dow === 3 || dow === 6) && !!workDay && workDay.rates.some(r => r.type === 'region');
      const isSunday = dow === 0;
      const isWeekend = dow === 0 || dow === 6;
      if (workDay) {
        days.push(
          <DayCell key={day} workDay={workDay} onSelectRates={onSelectRates} isToday={dateStr === todayString} isWeekend={isWeekend} isSunday={isSunday} isRegionDay={isRegionDay} showDetails={showDetails} />
        );
      }
    }
    return days;
  };

  return (
    <div className="cal">
      <div className="cal-nav">
        <button onClick={() => onNavigateMonth('prev')} className="cal-nav-btn">{'<'}</button>
        <div className="cal-month">{MONTH_NAMES[currentMonth]} {currentYear}</div>
        <button onClick={() => onNavigateMonth('next')} className="cal-nav-btn">{'>'}</button>
      </div>
      <div className="cal-weekdays">
        {WEEK_DAYS.map((d, i) => (
          <div key={d} className={'cal-weekday' + (i === 2 || i === 5 ? ' cal-region-day' : '')}>{d}</div>
        ))}
      </div>
      <div className="cal-grid">{renderDays()}</div>
    </div>
  );
};
