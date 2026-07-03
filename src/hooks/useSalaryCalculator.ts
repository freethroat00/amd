import { useState, useMemo, useEffect } from 'react';
import type { AppState, WorkRate, MonthData } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { createDefaultMonthData } from '../utils/salaryCalculations';

const getMonthKey = (year: number, month: number) => year + '-' + month;

export const useSalaryCalculator = () => {
  const [appState, setAppState] = useLocalStorage<AppState>('salaryCalculator', {
    months: []
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthData = useMemo((): MonthData => {
    const monthKey = getMonthKey(currentYear, currentMonth);
    const existingMonth = appState.months.find(
      m => getMonthKey(m.year, m.month) === monthKey
    );
    if (existingMonth) return existingMonth;
    return createDefaultMonthData(currentYear, currentMonth);
  }, [appState.months, currentYear, currentMonth]);

  const ensureMonth = (prev: AppState): AppState => {
    const monthKey = getMonthKey(currentYear, currentMonth);
    const exists = prev.months.some(m => getMonthKey(m.year, m.month) === monthKey);
    if (exists) return prev;
    return { ...prev, months: [...prev.months, createDefaultMonthData(currentYear, currentMonth)] };
  };

  const updateDay = (date: string, updates: Partial<{ isDayOff: boolean; hasLoading: boolean }>) => {
    setAppState(prev => {
      const state = ensureMonth(prev);
      const monthKey = getMonthKey(currentYear, currentMonth);
      const monthIndex = state.months.findIndex(m => getMonthKey(m.year, m.month) === monthKey);
      if (monthIndex === -1) return state;

      const updatedMonths = [...state.months];
      const month = { ...updatedMonths[monthIndex] };
      const dayIndex = month.days.findIndex(d => d.date === date);
      if (dayIndex === -1) return state;

      month.days = [...month.days];
      month.days[dayIndex] = { ...month.days[dayIndex], ...updates };
      updatedMonths[monthIndex] = month;
      return { ...state, months: updatedMonths };
    });
  };

  const updateRates = (date: string, rates: WorkRate[]) => {
    setAppState(prev => {
      const state = ensureMonth(prev);
      const monthKey = getMonthKey(currentYear, currentMonth);
      const monthIndex = state.months.findIndex(m => getMonthKey(m.year, m.month) === monthKey);
      if (monthIndex === -1) return state;

      const updatedMonths = [...state.months];
      const month = { ...updatedMonths[monthIndex] };
      const dayIndex = month.days.findIndex(d => d.date === date);
      if (dayIndex === -1) return state;

      month.days = [...month.days];
      month.days[dayIndex] = { ...month.days[dayIndex], rates };
      updatedMonths[monthIndex] = month;
      return { ...state, months: updatedMonths };
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
      return d;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  useEffect(() => {
    setAppState(prev => ensureMonth(prev));
  }, [currentYear, currentMonth, setAppState]);

  return {
    currentYear,
    currentMonth,
    monthData,
    updateRates,
    updateDay,
    navigateMonth,
    goToToday
  };
};
