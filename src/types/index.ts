export type RateType = 'pzv' | 'kbt' | 'region' | 'loading' | 'carwash' | 'errands';

export interface RegionDetails {
  orderCount: number;
  hasBusinessTrip: boolean;
  tips: number;
}

export interface WorkRate {
  type: RateType;
  multiplier?: number;
  regionDetails?: RegionDetails;
  errandsAmount?: number;
}

export interface WorkDay {
  date: string;
  rates: WorkRate[];
  isDayOff?: boolean;
  hasLoading?: boolean;
}

export interface RateConfig {
  pzv: number;
  kbt: number;
  regionPerOrder: number;
  businessTrip: number;
  loadingBonus: number;
  currency: string;
}

export const DEFAULT_RATE_CONFIG: RateConfig = {
  pzv: 80,
  kbt: 120,
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
