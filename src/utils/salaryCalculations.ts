import type { WorkDay, WorkRate, RateConfig, MonthData, RateType } from '../types';
import { DEFAULT_RATE_CONFIG } from '../types';

export const RATE_LABELS: Record<RateType, string> = {
  pzv: 'Минск',
  kbt: 'КБТ',
  region: 'Регион',
  loading: 'Загрузка',
  carwash: 'Мойка',
  errands: 'Поручения'
};

export const RATE_COLORS: Record<RateType, string> = {
  pzv: '#34c759',
  kbt: '#007aff',
  region: '#ff9500',
  loading: '#af52de',
  carwash: '#af52de',
  errands: '#af52de'
};

export const RATE_BG: Record<RateType, string> = {
  pzv: 'rgba(52,199,89,0.1)',
  kbt: 'rgba(0,122,255,0.1)',
  region: 'rgba(255,149,0,0.1)',
  loading: 'rgba(175,82,222,0.1)',
  carwash: 'rgba(175,82,222,0.1)',
  errands: 'rgba(175,82,222,0.1)'
};

export const calculateRateSalary = (rate: WorkRate, config: RateConfig = DEFAULT_RATE_CONFIG): number => {
  const m = rate.multiplier ?? 1;
  switch (rate.type) {
    case 'pzv': return config.pzv * m;
    case 'kbt': return config.kbt * m;
    case 'region':
      if (!rate.regionDetails) return 0;
      const orderPay = rate.regionDetails.orderCount * config.regionPerOrder;
      const tripPay = rate.regionDetails.hasBusinessTrip ? config.businessTrip : 0;
      const tips = rate.regionDetails.tips || 0;
      const mileagePay = Math.round(Math.max(0, (rate.regionDetails.mileage || 0) - 700) * 0.1 * 10) / 10;
      return (orderPay + tripPay + tips + mileagePay) * m;
    case 'loading': return config.loadingBonus * m;
    case 'carwash': return config.loadingBonus;
    case 'errands': return rate.errandsAmount || 0;
    default: return 0;
  }
};

export const calculateDaySalary = (day: WorkDay, config: RateConfig = DEFAULT_RATE_CONFIG): number => {
  return day.rates.reduce((total, rate) => total + calculateRateSalary(rate, config), 0);
};

export const calculateMonthSalary = (monthData: MonthData, config: RateConfig = DEFAULT_RATE_CONFIG): number => {
  return monthData.days.reduce((total, day) => total + calculateDaySalary(day, config), 0);
};

export const calculateRateStats = (monthData: MonthData, config: RateConfig = DEFAULT_RATE_CONFIG) => {
  const stats: Record<RateType, number> = { pzv: 0, kbt: 0, region: 0, loading: 0, carwash: 0, errands: 0 };
  monthData.days.forEach(day => {
    day.rates.forEach(rate => { stats[rate.type] += calculateRateSalary(rate, config); });
  });
  return stats;
};

export const calculateMonthStats = (monthData: MonthData, config: RateConfig = DEFAULT_RATE_CONFIG) => {
  const totalSalary = calculateMonthSalary(monthData, config);
  const rateStats = calculateRateStats(monthData, config);
  const workDays = monthData.days.filter(day => day.rates.length > 0).length;
  return { totalSalary, workDays, rateStats, averagePerDay: workDays > 0 ? totalSalary / workDays : 0 };
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
};

export const createDefaultMonthData = (year: number, month: number): MonthData => {
  const daysInMonth = getDaysInMonth(year, month);
  const days: WorkDay[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dow = date.getDay();
    const isRegionDay = dow === 3 || dow === 6;
    const rates: WorkRate[] = isRegionDay
      ? [{ type: 'region', regionDetails: { orderCount: 0, hasBusinessTrip: false, tips: 0, mileage: 0 } }]
      : [];
    days.push({ date: formatDate(date), rates });
  }
  return { year, month, days };
};
