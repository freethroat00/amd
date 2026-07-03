import { useState, useEffect, useRef } from 'react';
import type { WorkRate, RateType, RegionDetails } from '../../types';
import { DEFAULT_RATE_CONFIG } from '../../types';
import { RATE_LABELS, RATE_COLORS } from '../../utils/salaryCalculations';
import './RateSelector.css';

interface RateSelectorProps {
  currentRates: WorkRate[];
  hasLoading: boolean;
  onToggleRate: (rates: WorkRate[]) => void;
  onToggleLoading: (v: boolean) => void;
  onClose: () => void;
}

export const RateSelector: React.FC<RateSelectorProps> = ({
  currentRates, hasLoading,
  onToggleRate, onToggleLoading, onClose
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isRateSelected = (type: RateType) => currentRates.some(r => r.type === type);

  const getRegionDetails = (): RegionDetails => {
    const r = currentRates.find(r => r.type === 'region');
    return r?.regionDetails || { orderCount: 0, hasBusinessTrip: false, tips: 0 };
  };

  const [regionDetails, setRegionDetails] = useState<RegionDetails>(getRegionDetails());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const toggleRate = (type: RateType) => {
    if (isRateSelected(type)) {
      onToggleRate(currentRates.filter(r => r.type !== type));
    } else {
      const nr: WorkRate = type === 'region' ? { type, regionDetails } : { type };
      onToggleRate([...currentRates, nr]);
    }
  };

  const toggleMultiplier = (type: RateType) => {
    onToggleRate(currentRates.map(r => {
      if (r.type !== type) return r;
      return { ...r, multiplier: (r.multiplier ?? 1) === 1 ? 0.5 : 1 };
    }));
  };

  const handleClick = (type: RateType) => {
    const key = 'rate_' + type;
    if (timers.current.has(key)) {
      clearTimeout(timers.current.get(key)!);
      timers.current.delete(key);
      toggleMultiplier(type);
    } else {
      timers.current.set(key, setTimeout(() => {
        timers.current.delete(key);
        toggleRate(type);
      }, 250));
    }
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
        + (r.regionDetails.tips || 0);
      return sum + base * m;
    }
    return sum;
  }, hasLoading ? DEFAULT_RATE_CONFIG.loadingBonus : 0);

  const regionSel = isRateSelected('region');

  return (
    <div className={'rs-overlay' + (visible ? ' rs-visible' : '')} onClick={onClose}>
      <div className={'rs-modal' + (visible ? ' rs-visible' : '')} onClick={e => e.stopPropagation()}>
        <div className="rs-options">
          {(['pzv', 'kbt'] as RateType[]).map(type => {
            const sel = isRateSelected(type);
            const m = getM(type);
            return (
              <button
                key={type}
                data-color={RATE_COLORS[type]}
                className={'rs-card' + (sel ? ' rs-active' : '')}
                onClick={() => handleClick(type)}
              >
                <span className="rs-card-dot" style={sel ? undefined : { backgroundColor: RATE_COLORS[type] }} />
                <span className="rs-card-label" style={sel ? undefined : { color: RATE_COLORS[type] }}>
                  {RATE_LABELS[type]}
                </span>
                {sel && m === 0.5 && <span className="rs-card-mult">x0.5</span>}
              </button>
            );
          })}

          <button
            data-color="#af52de"
            className={'rs-card' + (hasLoading ? ' rs-active' : '')}
            onClick={() => onToggleLoading(!hasLoading)}
          >
            <span className="rs-card-dot" style={hasLoading ? undefined : { backgroundColor: 'var(--load)' }} />
            <span className="rs-card-label" style={hasLoading ? undefined : { color: 'var(--load)' }}>
              Загрузка
            </span>
          </button>

          <button
            data-color={RATE_COLORS.region}
            className={'rs-card' + (regionSel ? ' rs-active' : '')}
            onClick={() => handleClick('region')}
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
                <button
                  className={'rs-pill rs-pill-toggle' + (regionDetails.hasBusinessTrip ? ' rs-pill-active' : '')}
                  onClick={() => updateRegion({ hasBusinessTrip: !regionDetails.hasBusinessTrip })}
                >
                  <span className="rs-pill-label">Командиры</span>
                </button>
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
