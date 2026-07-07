import type { MonthData } from '../../types';
import './MonthSummary.css';

interface MonthSummaryProps {
  monthData: MonthData;
  businessTripSubtracted: boolean;
  onToggleBusinessTrip: () => void;
  mileageSubtracted: boolean;
  onToggleMileage: () => void;
}

export const MonthSummary: React.FC<MonthSummaryProps> = ({
  monthData, businessTripSubtracted, onToggleBusinessTrip, mileageSubtracted, onToggleMileage
}) => {
  let orders = 0;
  let loadingCount = 0;
  let businessTripTotal = 0;
  let mileagePay = 0;

  monthData.days.forEach(day => {
    day.rates.forEach(rate => {
      if (rate.type === 'region' && rate.regionDetails) {
        orders += rate.regionDetails.orderCount;
        if (rate.regionDetails.hasBusinessTrip) {
          businessTripTotal += 50;
        }
        const km = rate.regionDetails.mileage || 0;
        const overage = Math.max(0, km - 700);
        mileagePay += Math.round(overage * 0.1 * 10) / 10;
      }
      if (rate.type === 'loading') {
        loadingCount++;
      }
    });
  });

  return (
    <div className="ms">
      <div className="ms-pill">
        <span className="ms-pill-label">Точки</span>
        <span className="ms-pill-val">{orders}</span>
      </div>
      <div className="ms-pill">
        <span className="ms-pill-label">Загрузки</span>
        <span className="ms-pill-val">{loadingCount}</span>
      </div>
      <button
        className={'ms-pill ms-pill-btn' + (businessTripSubtracted ? ' ms-pill-subtracted' : '')}
        onClick={onToggleBusinessTrip}
      >
        <span className="ms-pill-label">Командиры</span>
        <span className="ms-pill-val">{businessTripTotal}</span>
      </button>
      <button
        className={'ms-pill ms-pill-btn' + (mileageSubtracted ? ' ms-pill-subtracted' : '')}
        onClick={onToggleMileage}
      >
        <span className="ms-pill-label">Пробег</span>
        <span className="ms-pill-val">{mileagePay}</span>
      </button>
    </div>
  );
};
