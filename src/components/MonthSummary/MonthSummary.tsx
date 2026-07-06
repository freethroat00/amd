import type { MonthData } from '../../types';
import './MonthSummary.css';

interface MonthSummaryProps {
  monthData: MonthData;
  businessTripSubtracted: boolean;
  onToggleBusinessTrip: () => void;
}

export const MonthSummary: React.FC<MonthSummaryProps> = ({
  monthData, businessTripSubtracted, onToggleBusinessTrip
}) => {
  let orders = 0;
  let loadingCount = 0;
  let businessTripTotal = 0;
  let mileageKm = 0;

  monthData.days.forEach(day => {
    day.rates.forEach(rate => {
      if (rate.type === 'region' && rate.regionDetails) {
        orders += rate.regionDetails.orderCount;
        if (rate.regionDetails.hasBusinessTrip) {
          businessTripTotal += 50;
        }
        mileageKm += rate.regionDetails.mileage || 0;
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
        className={'ms-pill ms-pill-btn' + (businessTripSubtracted ? ' ms-pill-active' : '')}
        onClick={onToggleBusinessTrip}
      >
        <span className="ms-pill-label">Командиры</span>
        <span className="ms-pill-val">{businessTripTotal}</span>
      </button>
      <div className="ms-pill">
        <span className="ms-pill-label">Пробег</span>
        <span className="ms-pill-val">{mileageKm > 0 ? mileageKm + 'км' : '—'}</span>
      </div>
    </div>
  );
};
