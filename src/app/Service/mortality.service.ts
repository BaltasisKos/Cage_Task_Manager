import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MortalityEntry {
  cageId: number;
  cageName: string;
  species: string;
  stockedQty: number;
  mortality: number;
  date: string;  // You may need to ensure your records have a date property
}

@Injectable({ providedIn: 'root' })
export class MortalityService {

  private storageKey = 'mortalityRecords';

  // Observable holding aggregated monthly mortality data (array of numbers, one per month)
  private mortalityDataSubject = new BehaviorSubject<number[]>(new Array(12).fill(0));
  mortalityData$ = this.mortalityDataSubject.asObservable();

  constructor() {
    this.loadAndEmitMonthlyMortality();
  }

  getMortalityByDate(date: Date): MortalityEntry[] {
    const allRecords = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const targetDate = date.toISOString().slice(0, 10);
    return allRecords.filter((record: any) => record.date === targetDate).map((r: any) => r.entries).flat() || [];
  }

  saveMortality(date: Date, entries: MortalityEntry[]): void {
    const allRecords = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const targetDate = date.toISOString().slice(0, 10);

    // Remove old record for date if exists
    const filtered = allRecords.filter((record: any) => record.date !== targetDate);

    // Add updated record
    filtered.push({ date: targetDate, entries });

    localStorage.setItem(this.storageKey, JSON.stringify(filtered));

    // Recalculate monthly mortality and emit new data
    this.loadAndEmitMonthlyMortality();
  }

  private loadAndEmitMonthlyMortality() {
    const allRecords = JSON.parse(localStorage.getItem(this.storageKey) || '[]');

    // Initialize an array with 12 months zeroed out
    const monthlyTotals = new Array(12).fill(0);

    // Aggregate mortality by month
    allRecords.forEach((record: any) => {
      const monthIndex = new Date(record.date).getMonth();
      // Sum mortality in entries for this month
      const monthlyMortalitySum = record.entries.reduce((sum: number, entry: MortalityEntry) => sum + (entry.mortality || 0), 0);
      monthlyTotals[monthIndex] += monthlyMortalitySum;
    });

    // Emit the new aggregated monthly mortality data
    this.mortalityDataSubject.next(monthlyTotals);
  }
}
