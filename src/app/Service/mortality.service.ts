import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MortalityEntry {
  cageId: number;
  cageName: string;
  species?: string;
  stockedQty?: number;
  mortality: number;
  date: string;
}

interface MortalityRecord {
  date: string;
  entries: MortalityEntry[];
}

@Injectable({ providedIn: 'root' })
export class MortalityService {

  private storageKey = 'mortalityRecords';

  private mortalityDataSubject = new BehaviorSubject<number[]>(new Array(12).fill(0));
  mortalityData$ = this.mortalityDataSubject.asObservable();

  constructor() {
    this.loadAndEmitMonthlyMortality();
  }

  getMortalityByDate(date: Date): MortalityEntry[] {
    const allRecords: MortalityRecord[] = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const targetDate = date.toISOString().slice(0, 10);
    const record = allRecords.find(r => r.date === targetDate);
    return record ? record.entries : [];
  }

  saveMortality(date: Date, entries: MortalityEntry[]): void {
    const allRecords: MortalityRecord[] = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const targetDate = date.toISOString().slice(0, 10);

    // Remove old record for date if exists
    const filtered = allRecords.filter(r => r.date !== targetDate);

    // Add updated record
    filtered.push({ date: targetDate, entries });

    localStorage.setItem(this.storageKey, JSON.stringify(filtered));

    this.loadAndEmitMonthlyMortality();
  }

  private loadAndEmitMonthlyMortality() {
    const allRecords: MortalityRecord[] = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    const monthlyTotals = new Array(12).fill(0);

    allRecords.forEach(record => {
      const monthIndex = new Date(record.date).getMonth();
      const monthlySum = record.entries.reduce((sum, entry) => sum + (entry.mortality || 0), 0);
      monthlyTotals[monthIndex] += monthlySum;
    });

    this.mortalityDataSubject.next(monthlyTotals);
  }
}
