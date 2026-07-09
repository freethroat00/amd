import { useState, useEffect } from 'react';
import type { WorkRate, RateType, RegionDetails, MinskFlag } from '../../types';
import { MINSK_FLAGS, DEFAULT_MINSK_FLAGS } from '../../types';
import { RATE_LABELS, RATE_COLORS } from '../../utils/salaryCalculations';
import './RateSelector.css';

interface RateSelectorProps {
  currentRates: WorkRate[];
  dayAdjustment: number;
  onToggleRate: (rates: WorkRate[], dayAdjustment: number) => void;
  onClose: () => void;
}

export const RateSelector: React.FC<RateSelectorProps> = ({
  currentRates, dayAdjustment, onToggleRate, onClose
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
      onToggleRate(currentRates.filter(r => r.type !== type), dayAdjustment);
    } else {
      const nr: WorkRate = type === 'region'
        ? { type, regionDetails }
        : type === 'errands'
          ? { type, errandsAmount: 0 }
          : type === 'minsk'
            ? { type, minskFlags: [...DEFAULT_MINSK_FLAGS] }
            : { type };
      onToggleRate([...currentRates, nr], dayAdjustment);
    }
  };

  const getMinskFlags = (): MinskFlag[] => {
    const r = currentRates.find(r => r.type === 'minsk');
    return r?.minskFlags ?? [];
  };

  const toggleMinskFlag = (flag: MinskFlag) => {
    const current = getMinskFlags();
    let next: MinskFlag[];

    if (current.includes(flag)) {
      next = current.filter(f => f !== flag);
      if (next.length === 0) next = ['pzv'];
    } else {
      next = [...current, flag];
    }

    const newRates = currentRates.map(r =>
      r.type === 'minsk' ? { ...r, minskFlags: next } : r
    );

    onToggleRate(newRates, 0);
  };

  const getCurrentSliderValue = (): number => {
    const flags = getMinskFlags();
    const base = flags.reduce((sum, f) => {
      const found = MINSK_FLAGS.find(mf => mf.key === f);
      return sum + (found?.rate ?? 0);
    }, 0);
    return base + dayAdjustment;
  };

  const handleSliderChange = (value: number) => {
    const flags = getMinskFlags();
    const base = flags.reduce((sum, f) => {
      const found = MINSK_FLAGS.find(mf => mf.key === f);
      return sum + (found?.rate ?? 0);
    }, 0);
    onToggleRate(currentRates, value - base);
  };

  const updateRegion = (updates: Partial<RegionDetails>) => {
    const nd = { ...regionDetails, ...updates };
    setRegionDetails(nd);
    onToggleRate(currentRates.map(r => r.type === 'region' ? { ...r, regionDetails: nd } : r), dayAdjustment);
  };

  const dayTotal = currentRates.reduce((sum, r) => {
    const m = r.multiplier ?? 1;
    if (r.type === 'pzv') return sum + 80 * m;
    if (r.type === 'kbt') return sum + 120 * m;
    if (r.type === 'minsk') {
      const flags = r.minskFlags ?? [];
      return sum + flags.reduce((s, f) => {
        if (f === 'supplier') return s + 40;
        if (f === 'pzv') return s + 40;
        if (f === 'kbt') return s + 120;
        return s;
      }, 0);
    }
    if (r.type === 'region' && r.regionDetails) {
      const base = r.regionDetails.orderCount * 7
        + (r.regionDetails.hasBusinessTrip ? 50 : 0)
        + (r.regionDetails.tips || 0)
        + Math.round(Math.max(0, (r.regionDetails.mileage || 0) - 700) * 0.1 * 10) / 10;
      return sum + base * m;
    }
    if (r.type === 'loading') return sum + 20 * m;
    if (r.type === 'carwash') return sum + 20;
    if (r.type === 'errands') return sum + (r.errandsAmount || 0);
    return sum;
  }, 0);

  const minskSelected = isRateSelected('minsk');
  const minskFlags = getMinskFlags();
  const sliderValue = getCurrentSliderValue();
  const allThree = minskFlags.length === 3;
  const sliderMax = allThree ? 200 : 160;
  const adjustment = dayAdjustment;

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
            data-color={RATE_COLORS.minsk}
            className={'rs-card' + (minskSelected ? ' rs-active' : '')}
            onClick={() => toggleRate('minsk')}
          >
            <span className="rs-card-dot" style={minskSelected ? undefined : { backgroundColor: RATE_COLORS.minsk }} />
            <span className="rs-card-label" style={minskSelected ? undefined : { color: RATE_COLORS.minsk }}>
              {RATE_LABELS.minsk}
            </span>
          </button>

          {minskSelected && (
            <div className="rs-minsk-block">
              <div className="rs-pill-row">
                {MINSK_FLAGS.map(f => (
                  <button
                    key={f.key}
                    className={'rs-pill rs-pill-toggle' + (minskFlags.includes(f.key) ? ' rs-pill-active' : '')}
                    onClick={() => toggleMinskFlag(f.key)}
                  >
                    <span className="rs-pill-label">{f.label}</span>
                    <span className="rs-pill-rate">{f.rate}</span>
                  </button>
                ))}
              </div>

              {minskFlags.length > 0 && (
                <div className="rs-slider-block">
                  <input
                    type="range"
                    className="rs-slider"
                    min={0}
                    max={sliderMax}
                    step={10}
                    value={sliderValue}
                    onChange={e => handleSliderChange(Number(e.target.value))}
                  />
                  <div className="rs-slider-labels">
                    <span>0</span>
                    <span className="rs-slider-current">{sliderValue} BYN</span>
                    <span>{sliderMax}</span>
                  </div>
                </div>
              )}
            </div>
          )}

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
                    type="number" min="0" step="0.1" placeholder="0"
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
                <button
                  className={'rs-pill rs-pill-toggle' + (loadingSel ? ' rs-pill-active' : '')}
                  onClick={() => {
                    if (loadingSel) {
                      onToggleRate(currentRates.filter(r => r.type !== 'loading'), dayAdjustment);
                    } else {
                      onToggleRate([...currentRates, { type: 'loading' }], dayAdjustment);
                    }
                  }}
                >
                  <span className="rs-pill-label">Загрузка</span>
                </button>

                <button
                  className={'rs-pill rs-pill-toggle' + (carwashSel ? ' rs-pill-active' : '')}
                  onClick={() => {
                    if (carwashSel) {
                      onToggleRate(currentRates.filter(r => r.type !== 'carwash'), dayAdjustment);
                    } else {
                      onToggleRate([...currentRates, { type: 'carwash' }], dayAdjustment);
                    }
                  }}
                >
                  <span className="rs-pill-label">Мойка</span>
                </button>

                <div
                  className="rs-pill"
                  onClick={() => {
                    if (errandsSel && getErrandsAmount() === 0) {
                      onToggleRate(currentRates.filter(r => r.type !== 'errands'), dayAdjustment);
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
                        onToggleRate([...currentRates, { type: 'errands', errandsAmount: val }], dayAdjustment);
                      } else if (val === 0) {
                        onToggleRate(currentRates.filter(r => r.type !== 'errands'), dayAdjustment);
                      } else {
                        onToggleRate(currentRates.map(r => r.type === 'errands' ? { ...r, errandsAmount: val } : r), dayAdjustment);
                      }
                    }}
                    onFocus={() => {
                      if (!errandsSel) {
                        onToggleRate([...currentRates, { type: 'errands', errandsAmount: 0 }], dayAdjustment);
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
          <span className="rs-preview-val">{dayTotal + adjustment} BYN</span>
        </div>
      </div>
    </div>
  );
};
