import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Mortality, MortalityEntry } from '../models/mortality.model';

@Injectable({ providedIn: 'root' })
export class MortalityService {
  private storageKey = 'mortalityRecords';

  private mortalityDataSubject = new BehaviorSubject<number[]>(new Array(12).fill(0));
  mortalityData$ = this.mortalityDataSubject.asObservable();

  constructor() {
    this.loadAndEmitMonthlyMortality();
  }

  // Return a Promise to support async/await usage
  getMortalityByDate(date: Date): Promise<MortalityEntry[]> {
    return new Promise(resolve => {
      const allRecords: Mortality[] = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      const targetDate = date.toISOString().slice(0, 10);
      const record = allRecords.find(r => r.date === targetDate);
      resolve(record ? record.entries : []);
    });
  }

  // Return Promise<void> so caller can await saving completion
  saveMortality(date: Date, entries: MortalityEntry[]): Promise<void> {
    return new Promise(resolve => {
      const allRecords: Mortality[] = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      const targetDate = date.toISOString().slice(0, 10);

      // Remove old record for date if exists
      const filtered = allRecords.filter(r => r.date !== targetDate);

      // Add updated record
      filtered.push({ date: targetDate, entries });

      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      this.loadAndEmitMonthlyMortality();
      resolve();
    });
  }

  private loadAndEmitMonthlyMortality() {
    const allRecords: Mortality[] = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const monthlyTotals = new Array(12).fill(0);

    allRecords.forEach(record => {
      const monthIndex = new Date(record.date).getMonth();
      const monthlySum = record.entries.reduce((sum, entry) => sum + (entry.mortality || 0), 0);
      monthlyTotals[monthIndex] += monthlySum;
    });

    this.mortalityDataSubject.next(monthlyTotals);
  }
}
