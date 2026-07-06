import { useState, useEffect } from 'react';
import type { WorkRate, RateType, RegionDetails } from '../../types';
import { DEFAULT_RATE_CONFIG } from '../../types';
import { RATE_LABELS, RATE_COLORS } from '../../utils/salaryCalculations';
import './RateSelector.css';

interface RateSelectorProps {
  currentRates: WorkRate[];
  onToggleRate: (rates: WorkRate[]) => void;
  onClose: () => void;
}

export const RateSelector: React.FC<RateSelectorProps> = ({
  currentRates, onToggleRate, onClose
}) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const isRateSelected = (type: RateType) => currentRates.some(r => r.type === type);

  const getRegionDetails = (): RegionDetails => {
    const r = currentRates.find(r => r.type === 'region');
    return r?.regionDetails || { orderCount: 0, hasBusinessTrip: false, tips: 0, mileage: 0 };
  };

  const [regionDetails, setRegionDetails] = useState<RegionDetails>(getRegionDetails());

  const toggleRate = (type: RateType) => {
    if (isRateSelected(type)) {
      onToggleRate(currentRates.filter(r => r.type !== type));
    } else {
      const nr: WorkRate = type === 'region'
        ? { type, regionDetails }
        : type === 'errands'
          ? { type, errandsAmount: 0 }
          : { type };
      onToggleRate([...currentRates, nr]);
    }
  };

  const toggleMultiplier = (type: RateType) => {
    onToggleRate(currentRates.map(r => {
      if (r.type !== type) return r;
      return { ...r, multiplier: (r.multiplier ?? 1) === 1 ? 0.5 : 1 };
    }));
  };

  const updateRegion = (updates: Partial<RegionDetails>) => {
    const nd = { ...regionDetails, ...updates };
    setRegionDetails(nd);
    onToggleRate(currentRates.map(r => r.type === 'region' ? { ...r, regionDetails: nd } : r));
  };

  const getM = (type: RateType) => currentRates.find(r => r.type === type)?.multiplier ?? 1;

  const dayTotal = currentRates.reduce((sum, r) => {
    const m = r.multiplier ?? 1;
    if (r.type === 'pzv') return sum + DEFAULT_RATE_CONFIG.pzv * m;
    if (r.type === 'kbt') return sum + DEFAULT_RATE_CONFIG.kbt * m;
    if (r.type === 'region' && r.regionDetails) {
      const base = r.regionDetails.orderCount * DEFAULT_RATE_CONFIG.regionPerOrder
        + (r.regionDetails.hasBusinessTrip ? DEFAULT_RATE_CONFIG.businessTrip : 0)
        + (r.regionDetails.tips || 0)
        + Math.max(0, (r.regionDetails.mileage || 0) - 700) * 0.1;
      return sum + base * m;
    }
    if (r.type === 'loading') return sum + DEFAULT_RATE_CONFIG.loadingBonus * m;
    if (r.type === 'carwash') return sum + DEFAULT_RATE_CONFIG.loadingBonus;
    if (r.type === 'errands') return sum + (r.errandsAmount || 0);
    return sum;
  }, 0);

  const regionSel = isRateSelected('region');
  const extrasSel = isRateSelected('loading') || isRateSelected('carwash') || isRateSelected('errands');
  const loadingSel = isRateSelected('loading');
  const carwashSel = isRateSelected('carwash');
  const errandsSel = isRateSelected('errands');

  const getErrandsAmount = () => currentRates.find(r => r.type === 'errands')?.errandsAmount ?? 0;

  return (
    <div className={'rs-overlay' + (visible ? ' rs-visible' : '') + (closing ? ' rs-closing' : '')} onClick={handleClose}>
      <div className={'rs-modal' + (visible ? ' rs-visible' : '')} onClick={e => e.stopPropagation()}>
        <div className="rs-options">
          {/* Минск */}
          <button
            data-color={RATE_COLORS.pzv}
            className={'rs-card' + (isRateSelected('pzv') ? ' rs-active' : '')}
            onClick={() => toggleRate('pzv')}
          >
            <span className="rs-card-dot" style={isRateSelected('pzv') ? undefined : { backgroundColor: RATE_COLORS.pzv }} />
            <span className="rs-card-label" style={isRateSelected('pzv') ? undefined : { color: RATE_COLORS.pzv }}>
              {RATE_LABELS.pzv}
            </span>
            {isRateSelected('pzv') && (
              <button
                className={'rs-x05' + (getM('pzv') === 0.5 ? ' rs-x05-active' : '')}
                onClick={(e) => { e.stopPropagation(); toggleMultiplier('pzv'); }}
              >
                x0.5
              </button>
            )}
          </button>

          {/* Регион */}
          <button
            data-color={RATE_COLORS.region}
            className={'rs-card' + (regionSel ? ' rs-active' : '')}
            onClick={() => toggleRate('region')}
          >
            <span className="rs-card-dot" style={regionSel ? undefined : { backgroundColor: RATE_COLORS.region }} />
            <span className="rs-card-label" style={regionSel ? undefined : { color: RATE_COLORS.region }}>
              {RATE_LABELS.region}
            </span>
            {regionSel && getM('region') === 0.5 && <span className="rs-card-mult">x0.5</span>}
          </button>

          {regionSel && (
            <div className="rs-region-block">
              <div className="rs-pill-row">
                <div className="rs-pill">
                  <span className="rs-pill-label">Заказы</span>
                  <input
                    type="number" min="0" placeholder="0"
                    value={regionDetails.orderCount || ''}
                    onChange={e => updateRegion({ orderCount: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="rs-pill-input"
                  />
                </div>
                <div className="rs-pill">
                  <span className="rs-pill-label">Чаевые</span>
                  <input
                    type="number" min="0" placeholder="0"
                    value={regionDetails.tips || ''}
                    onChange={e => updateRegion({ tips: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="rs-pill-input"
                  />
                </div>
                <div className="rs-pill">
                  <span className="rs-pill-label">Пробег</span>
                  <input
                    type="number" min="0" placeholder="0"
                    value={regionDetails.mileage || ''}
                    onChange={e => updateRegion({ mileage: e.target.value === '' ? 0 : Number(e.target.value) })}
                    className="rs-pill-input"
                  />
                </div>
                <button
                  className={'rs-pill rs-pill-toggle' + (regionDetails.hasBusinessTrip ? ' rs-pill-active' : '')}
                  onClick={() => updateRegion({ hasBusinessTrip: !regionDetails.hasBusinessTrip })}
                >
                  <span className="rs-pill-label">Командиры</span>
                </button>
              </div>
            </div>
          )}

          {/* КБТ */}
          <button
            data-color={RATE_COLORS.kbt}
            className={'rs-card' + (isRateSelected('kbt') ? ' rs-active' : '')}
            onClick={() => toggleRate('kbt')}
          >
            <span className="rs-card-dot" style={isRateSelected('kbt') ? undefined : { backgroundColor: RATE_COLORS.kbt }} />
            <span className="rs-card-label" style={isRateSelected('kbt') ? undefined : { color: RATE_COLORS.kbt }}>
              {RATE_LABELS.kbt}
            </span>
            {isRateSelected('kbt') && (
              <button
                className={'rs-x05' + (getM('kbt') === 0.5 ? ' rs-x05-active' : '')}
                onClick={(e) => { e.stopPropagation(); toggleMultiplier('kbt'); }}
              >
                x0.5
              </button>
            )}
          </button>

          {/* Допы */}
          <button
            data-color="#af52de"
            className={'rs-card' + (extrasSel ? ' rs-active' : '')}
            onClick={() => setShowExtras(!showExtras)}
          >
            <span className="rs-card-dot" style={extrasSel ? undefined : { backgroundColor: '#af52de' }} />
            <span className="rs-card-label" style={extrasSel ? undefined : { color: '#af52de' }}>
              Допы
            </span>
          </button>

          {showExtras && (
            <div className="rs-region-block">
              <div className="rs-pill-row">
                {/* Загрузка */}
                <button
                  className={'rs-pill rs-pill-toggle' + (loadingSel ? ' rs-pill-active' : '')}
                  onClick={() => {
                    if (loadingSel) {
                      onToggleRate(currentRates.filter(r => r.type !== 'loading'));
                    } else {
                      onToggleRate([...currentRates, { type: 'loading' }]);
                    }
                  }}
                >
                  <span className="rs-pill-label">Загрузка</span>
                </button>

                {/* Мойка */}
                <button
                  className={'rs-pill rs-pill-toggle' + (carwashSel ? ' rs-pill-active' : '')}
                  onClick={() => {
                    if (carwashSel) {
                      onToggleRate(currentRates.filter(r => r.type !== 'carwash'));
                    } else {
                      onToggleRate([...currentRates, { type: 'carwash' }]);
                    }
                  }}
                >
                  <span className="rs-pill-label">Мойка</span>
                </button>

                {/* Поручения */}
                <div
                  className="rs-pill"
                  onClick={() => {
                    if (errandsSel && getErrandsAmount() === 0) {
                      onToggleRate(currentRates.filter(r => r.type !== 'errands'));
                    }
                  }}
                >
                  <span className="rs-pill-label">Поручения</span>
                  <input
                    type="number" min="0" placeholder="0"
                    value={errandsSel ? (getErrandsAmount() || '') : ''}
                    onChange={e => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      if (!errandsSel) {
                        onToggleRate([...currentRates, { type: 'errands', errandsAmount: val }]);
                      } else if (val === 0) {
                        onToggleRate(currentRates.filter(r => r.type !== 'errands'));
                      } else {
                        onToggleRate(currentRates.map(r => r.type === 'errands' ? { ...r, errandsAmount: val } : r));
                      }
                    }}
                    onFocus={() => {
                      if (!errandsSel) {
                        onToggleRate([...currentRates, { type: 'errands', errandsAmount: 0 }]);
                      }
                    }}
                    className="rs-pill-input"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={'rs-preview' + (dayTotal === 0 ? ' rs-preview-zero' : '')}>
          <span className="rs-preview-val">{dayTotal} BYN</span>
        </div>
      </div>
    </div>
  );
};
