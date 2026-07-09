import { calculateRateSalary, calculateDaySalary, calculateMonthSalary, calculateMonthStats } from './salaryCalculations';
import type { WorkDay, MonthData, WorkRate } from '../types';

describe('Salary Calculations', () => {
  test('calculateRateSalary for PZV', () => {
    const rate: WorkRate = { type: 'pzv' };
    expect(calculateRateSalary(rate)).toBe(80);
  });

  test('calculateRateSalary for KBT', () => {
    const rate: WorkRate = { type: 'kbt' };
    expect(calculateRateSalary(rate)).toBe(120);
  });

  test('calculateRateSalary for minsk with default flags', () => {
    const rate: WorkRate = { type: 'minsk', minskFlags: ['supplier', 'pzv'] };
    expect(calculateRateSalary(rate)).toBe(80);
  });

  test('calculateRateSalary for minsk with all flags', () => {
    const rate: WorkRate = { type: 'minsk', minskFlags: ['supplier', 'pzv', 'kbt'] };
    expect(calculateRateSalary(rate)).toBe(200);
  });

  test('calculateRateSalary for minsk with only kbt', () => {
    const rate: WorkRate = { type: 'minsk', minskFlags: ['kbt'] };
    expect(calculateRateSalary(rate)).toBe(120);
  });

  test('calculateRateSalary for minsk with no flags', () => {
    const rate: WorkRate = { type: 'minsk', minskFlags: [] };
    expect(calculateRateSalary(rate)).toBe(0);
  });

  test('calculateRateSalary for region without trip', () => {
    const rate: WorkRate = {
      type: 'region',
      regionDetails: { orderCount: 5, hasBusinessTrip: false, tips: 0, mileage: 0 }
    };
    expect(calculateRateSalary(rate)).toBe(35);
  });

  test('calculateRateSalary for region with trip', () => {
    const rate: WorkRate = {
      type: 'region',
      regionDetails: { orderCount: 5, hasBusinessTrip: true, tips: 0, mileage: 0 }
    };
    expect(calculateRateSalary(rate)).toBe(85);
  });

  test('calculateDaySalary with multiple rates', () => {
    const day: WorkDay = {
      date: '2024-01-15',
      rates: [
        { type: 'pzv' },
        { type: 'kbt' }
      ]
    };
    expect(calculateDaySalary(day)).toBe(200);
  });

  test('calculateDaySalary for day off', () => {
    const day: WorkDay = {
      date: '2024-01-15',
      rates: []
    };
    expect(calculateDaySalary(day)).toBe(0);
  });

  test('calculateDaySalary with dayAdjustment', () => {
    const day: WorkDay = {
      date: '2024-01-15',
      rates: [{ type: 'minsk', minskFlags: ['supplier', 'pzv'] }],
      dayAdjustment: 20
    };
    expect(calculateDaySalary(day)).toBe(100);
  });

  test('calculateDaySalary with negative dayAdjustment', () => {
    const day: WorkDay = {
      date: '2024-01-15',
      rates: [{ type: 'minsk', minskFlags: ['supplier', 'pzv'] }],
      dayAdjustment: -30
    };
    expect(calculateDaySalary(day)).toBe(50);
  });

  test('calculateDaySalary with dayAdjustment floor at 0', () => {
    const day: WorkDay = {
      date: '2024-01-15',
      rates: [{ type: 'minsk', minskFlags: ['supplier', 'pzv'] }],
      dayAdjustment: -100
    };
    expect(calculateDaySalary(day)).toBe(0);
  });

  test('calculateMonthSalary', () => {
    const monthData: MonthData = {
      year: 2024,
      month: 0,
      days: [
        { date: '2024-01-01', rates: [{ type: 'pzv' }] },
        { date: '2024-01-02', rates: [{ type: 'kbt' }] },
        { date: '2024-01-03', rates: [] },
        { date: '2024-01-04', rates: [{ type: 'region', regionDetails: { orderCount: 10, hasBusinessTrip: true, tips: 0, mileage: 0 } }] }
      ]
    };
    expect(calculateMonthSalary(monthData)).toBe(320);
  });

  test('calculateMonthStats', () => {
    const monthData: MonthData = {
      year: 2024,
      month: 0,
      days: [
        { date: '2024-01-01', rates: [{ type: 'pzv' }] },
        { date: '2024-01-02', rates: [{ type: 'kbt' }] },
        { date: '2024-01-03', rates: [] },
        { date: '2024-01-04', rates: [{ type: 'region', regionDetails: { orderCount: 10, hasBusinessTrip: true, tips: 0, mileage: 0 } }] }
      ]
    };

    const stats = calculateMonthStats(monthData);

    expect(stats.totalSalary).toBe(320);
    expect(stats.workDays).toBe(3);
    expect(stats.rateStats.pzv).toBe(80);
    expect(stats.rateStats.kbt).toBe(120);
    expect(stats.rateStats.region).toBe(120);
    expect(stats.averagePerDay).toBeCloseTo(106.67);
  });
});
