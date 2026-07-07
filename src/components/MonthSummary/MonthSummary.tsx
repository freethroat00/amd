import { useState } from 'react';
import type { MonthData } from '../../types';
import { DEFAULT_RATE_CONFIG } from '../../types';
import './MonthSummary.css';

interface MonthSummaryProps {
  monthData: MonthData;
  mileageSubtracted: boolean;
  onToggleMileage: () => void;
  extrasSubtracted: Record<string, boolean>;
  onToggleExtra: (key: string) => void;
}

const EXTRA_ITEMS = [
  { key: 'komandirovki', label: 'Командиры', color: '#ff9500' },
  { key: 'chayevye', label: 'Чаевые', color: '#34c759' },
  { key: 'moiki', label: 'Мойки', color: '#af52de' },
  { key: 'porucheniya', label: 'Поручения', color: '#007aff' },
] as const;

export const MonthSummary: React.FC<MonthSummaryProps> = ({
  monthData, mileageSubtracted, onToggleMileage, extrasSubtracted, onToggleExtra
}) => {
  const [dopyOpen, setDopyOpen] = useState(false);

  let orders = 0;
  let loadingCount = 0;
  let mileagePay = 0;
  let komandirovki = 0;
  let chayevye = 0;
  let moiki = 0;
  let porucheniya = 0;

  monthData.days.forEach(day => {
    day.rates.forEach(rate => {
      if (rate.type === 'region' && rate.regionDetails) {
        orders += rate.regionDetails.orderCount;
        if (rate.regionDetails.hasBusinessTrip) {
          komandirovki += DEFAULT_RATE_CONFIG.businessTrip;
        }
        chayevye += rate.regionDetails.tips || 0;
        const km = rate.regionDetails.mileage || 0;
        const overage = Math.max(0, km - 700);
        mileagePay += Math.round(overage * 0.1 * 10) / 10;
      }
      if (rate.type === 'loading') {
        loadingCount++;
      }
      if (rate.type === 'carwash') {
        moiki += DEFAULT_RATE_CONFIG.loadingBonus;
      }
      if (rate.type === 'errands') {
        porucheniya += rate.errandsAmount || 0;
      }
    });
  });

  const extrasMap: Record<string, number> = {
    komandirovki,
    chayevye,
    moiki,
    porucheniya,
  };

  const dopyTotal = komandirovki + chayevye + moiki + porucheniya;

  return (
    <>
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
          className={'ms-pill ms-pill-btn' + (mileageSubtracted ? ' ms-pill-subtracted' : '')}
          onClick={onToggleMileage}
        >
          <span className="ms-pill-label">Пробег</span>
          <span className="ms-pill-val">{mileagePay}</span>
        </button>
        <button
          className="ms-pill ms-pill-btn"
          onClick={() => setDopyOpen(true)}
        >
          <span className="ms-pill-label">Допы</span>
          <span className="ms-pill-val">{dopyTotal}</span>
        </button>
      </div>

      {dopyOpen && (
        <div className="ms-modal-overlay" onClick={() => setDopyOpen(false)}>
          <div className="ms-modal" onClick={e => e.stopPropagation()}>
            <div className="ms-modal-row">
              {EXTRA_ITEMS.map(item => (
                <button
                  key={item.key}
                  className={'ms-modal-card' + (extrasSubtracted[item.key] ? ' ms-modal-active' : '')}
                  onClick={() => onToggleExtra(item.key)}
                >
                  <span className="ms-modal-dot" style={{ background: extrasSubtracted[item.key] ? '#fff' : item.color }} />
                  <span className="ms-modal-label">{item.label}</span>
                  <span className="ms-modal-val">{extrasMap[item.key]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
