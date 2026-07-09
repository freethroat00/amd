import type { WorkDay, RateType, MinskFlag } from '../../types';
import { RATE_COLORS, RATE_BG } from '../../utils/salaryCalculations';
import './DayCell.css';

interface DayCellProps {
  workDay: WorkDay;
  onSelectRates: (date: string) => void;
  isToday: boolean;
  isWeekend: boolean;
  isSunday: boolean;
  isRegionDay: boolean;
  showDetails?: boolean;
}

const FLAG_COLORS: Record<MinskFlag, string> = {
  supplier: '#34c759',
  pzv: '#007aff',
  kbt: '#ff9500',
};

export const DayCell: React.FC<DayCellProps> = ({ workDay, onSelectRates, isToday, isWeekend, isSunday, isRegionDay, showDetails }) => {
  const dayNumber = new Date(workDay.date).getDate();
  const hasRates = workDay.rates.length > 0;
  const primaryType = hasRates ? workDay.rates[0].type : null;

  const regionRate = workDay.rates.find(r => r.type === 'region');
  const orderCount = regionRate?.regionDetails?.orderCount || 0;
  const hasBusinessTrip = regionRate?.regionDetails?.hasBusinessTrip || false;
  const hasLoading = workDay.rates.some(r => r.type === 'loading');
  const hasCarwash = workDay.rates.some(r => r.type === 'carwash');

  const minskRate = workDay.rates.find(r => r.type === 'minsk');
  const minskFlags = minskRate?.minskFlags ?? [];

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

  const isLight = isToday && primaryType;

  return (
    <div className={cls} style={cellStyle} onClick={() => onSelectRates(workDay.date)}>
      <div className="cal-day-num" style={isLight ? { color: '#fff', fontWeight: 800 } : primaryType && !isToday ? { color: RATE_COLORS[primaryType as RateType] } : isRegionDay && !isToday && !hasRates && !isWeekend ? { color: 'var(--region)' } : undefined}>
        {dayNumber}
      </div>
      {isToday && !hasRates && <div className="cal-today-dot" />}
      {hasRates && showDetails && (
        <div className="cal-day-info">
          {orderCount > 0 && <span className="cal-day-orders" style={isLight ? { color: '#fff' } : undefined}>{orderCount}</span>}
          {minskFlags.map(f => (
            <span key={f} className="cal-day-flag" style={{ background: isLight ? '#fff' : FLAG_COLORS[f] }} />
          ))}
          {hasLoading && <span className="cal-day-loading" style={isLight ? { background: '#fff' } : undefined} />}
          {hasCarwash && <span className="cal-day-carwash" style={isLight ? { background: '#fff' } : undefined} />}
          {hasBusinessTrip && <span className="cal-day-trip" style={isLight ? { color: '#fff' } : undefined}>✈</span>}
        </div>
      )}
    </div>
  );
};
