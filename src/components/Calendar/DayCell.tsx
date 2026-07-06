import type { WorkDay, RateType } from '../../types';
import { RATE_COLORS, RATE_BG } from '../../utils/salaryCalculations';
import './DayCell.css';

interface DayCellProps {
  workDay: WorkDay;
  onSelectRates: (date: string) => void;
  isToday: boolean;
  isWeekend: boolean;
  isSunday: boolean;
  isRegionDay: boolean;
}

export const DayCell: React.FC<DayCellProps> = ({ workDay, onSelectRates, isToday, isWeekend, isSunday, isRegionDay }) => {
  const dayNumber = new Date(workDay.date).getDate();
  const hasRates = workDay.rates.length > 0;
  const primaryType = hasRates ? workDay.rates[0].type : null;

  let cls = 'cal-day';
  if (isToday && hasRates) cls += ' cal-today-colored';
  else if (isToday) cls += ' cal-today-empty';
  else if (isSunday && !hasRates) cls += ' cal-dayoff';
  else if (isWeekend && !hasRates) cls += ' cal-we';
  else if (!hasRates) cls += ' cal-day-empty';

  const cellStyle: React.CSSProperties = {};
  if (isToday && primaryType) {
    cellStyle.background = RATE_COLORS[primaryType as RateType];
    cellStyle.borderColor = 'transparent';
    cellStyle.boxShadow = '0 2px 10px ' + RATE_COLORS[primaryType as RateType] + '44';
  } else if (!isToday && primaryType) {
    cellStyle.background = RATE_BG[primaryType as RateType];
    cellStyle.borderColor = RATE_COLORS[primaryType as RateType] + '33';
  } else if (!isToday && isRegionDay && !hasRates && !isWeekend) {
    cellStyle.background = 'var(--region-bg)';
    cellStyle.borderColor = 'rgba(255,149,0,0.2)';
  }

  return (
    <div className={cls} style={cellStyle} onClick={() => onSelectRates(workDay.date)}>
      <div className="cal-day-num" style={isToday && primaryType ? { color: '#fff', fontWeight: 800 } : primaryType && !isToday ? { color: RATE_COLORS[primaryType as RateType] } : isRegionDay && !isToday && !hasRates && !isWeekend ? { color: 'var(--region)' } : undefined}>
        {dayNumber}
      </div>
      {isToday && !hasRates && <div className="cal-today-dot" />}
    </div>
  );
};
