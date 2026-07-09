export type RateType = 'pzv' | 'kbt' | 'minsk' | 'region' | 'loading' | 'carwash' | 'errands';

export type MinskFlag = 'supplier' | 'pzv' | 'kbt';

export const MINSK_FLAGS: { key: MinskFlag; label: string; rate: number }[] = [
  { key: 'supplier', label: 'Поставщик', rate: 40 },
  { key: 'pzv',      label: 'ПВЗ',      rate: 40 },
  { key: 'kbt',      label: 'КБТ',      rate: 120 },
];
export const DEFAULT_MINSK_FLAGS: MinskFlag[] = ['supplier', 'pzv'];

export interface RegionDetails {
  orderCount: number;
  hasBusinessTrip: boolean;
  tips: number;
  mileage: number;
}

export interface WorkRate {
  type: RateType;
  multiplier?: number;
  regionDetails?: RegionDetails;
  errandsAmount?: number;
  minskFlags?: MinskFlag[];
}

export interface WorkDay {
  date: string;
  rates: WorkRate[];
  isDayOff?: boolean;
  hasLoading?: boolean;
  dayAdjustment?: number;
}

export interface RateConfig {
  pzv: number;
  kbt: number;
  minskSupplier: number;
  minskPzv: number;
  minskKbt: number;
  regionPerOrder: number;
  businessTrip: number;
  loadingBonus: number;
  currency: string;
}

export const DEFAULT_RATE_CONFIG: RateConfig = {
  pzv: 80,
  kbt: 120,
  minskSupplier: 40,
  minskPzv: 40,
  minskKbt: 120,
  regionPerOrder: 7,
  businessTrip: 50,
  loadingBonus: 20,
  currency: 'BYN'
};

export interface MonthData {
  year: number;
  month: number;
  days: WorkDay[];
}

export interface AppState {
  months: MonthData[];
}

export interface Note {
  id: string;
  text: string;
  createdAt: number;
}
