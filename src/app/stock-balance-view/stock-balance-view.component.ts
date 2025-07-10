import { Component, OnInit, OnDestroy } from '@angular/core';
import { CageService } from '../Service/cage.service';
import { Fish } from '../models/fish.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Balance } from '../models/balance.model';
import { Mortality, MortalityEntry } from '../models/mortality.model';
import { MortalityService } from '../Service/mortality.service';

@Component({
  selector: 'app-stock-balance-view',
  templateUrl: './stock-balance-view.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class StockBalanceViewComponent implements OnInit, OnDestroy {
  cages: any[] = [];
  cageIdNameMap: { [key: number]: string } = {};
  stockedFishSummary: Fish[] = [];
  mortalitySummary: { cageId: number; mortality: number }[] = [];
  stockBalanceList: Balance[] = [];
  private mortalitySub?: Subscription;

  balanceDate: string = this.getToday();

  constructor(
    private cageService: CageService,
    private mortalityService: MortalityService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cageService.cages$.subscribe(async cages => {
      this.cages = cages;
      this.cageIdNameMap = {};
      cages.forEach(c => (this.cageIdNameMap[c.id] = c.name));

      await this.loadSummaryForDate(this.balanceDate);
      await this.loadMortalityForDate(this.balanceDate);
      this.calculateStockBalance();
    });

    this.mortalitySub = this.mortalityService.mortalityData$.subscribe(async () => {
      await this.loadMortalityForDate(this.balanceDate);
      this.calculateStockBalance();
    });
  }

  ngOnDestroy() {
    this.mortalitySub?.unsubscribe();
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  async onDateChange() {
    await this.loadSummaryForDate(this.balanceDate);
    await this.loadMortalityForDate(this.balanceDate);
    this.calculateStockBalance();
  }

  async loadSummaryForDate(date: string) {
    const allData = this.getAllStockingData();
    const stockedFish = allData[date] || [];

    this.stockedFishSummary = this.cages.map(cage => {
      const match = stockedFish.find(f => f.cageId === cage.id);
      return {
        cageId: cage.id,
        species: match?.species || '',
        qty: match?.qty || 0,
        date: new Date(date)
      };
    });
  }

  async loadMortalityForDate(date: string) {
    const dateObj = new Date(date);
    const entries = await this.mortalityService.getMortalityByDate(dateObj);

    this.mortalitySummary = this.cages.map(cage => {
      const entry = entries.find(e => e.cageId === cage.id);
      return {
        cageId: cage.id,
        mortality: entry?.mortality || 0
      };
    });
  }

  calculateStockBalance() {
    const selectedDate = new Date(this.balanceDate);
    const stockingData = this.getAllStockingData();

    const balanceMap: { [cageId: number]: { stocked: number; mortality: number } } = {};

    // Sum stocked fish up to the selected date
    for (const dateStr in stockingData) {
      if (!stockingData.hasOwnProperty(dateStr)) continue;

      const date = new Date(dateStr);
      if (date <= selectedDate) {
        for (const entry of stockingData[dateStr]) {
          if (!this.cageIdNameMap[entry.cageId]) continue;
          if (!balanceMap[entry.cageId]) balanceMap[entry.cageId] = { stocked: 0, mortality: 0 };

          balanceMap[entry.cageId].stocked += Number(entry.qty) || 0;
        }
      }
    }

    // Use mortalitySummary (already filtered for this.balanceDate)
    this.mortalitySummary.forEach(entry => {
      if (!this.cageIdNameMap[entry.cageId]) return;
      if (!balanceMap[entry.cageId]) balanceMap[entry.cageId] = { stocked: 0, mortality: 0 };

      balanceMap[entry.cageId].mortality += Number(entry.mortality) || 0;
    });

    this.stockBalanceList = [];

    for (const cageIdStr in balanceMap) {
      const cageId = +cageIdStr;
      const data = balanceMap[cageId];

      this.stockBalanceList.push({
        cageId,
        cageName: this.getCageNameById(cageId),
        stocked: data.stocked,
        mortality: data.mortality,
        balance: Math.max(0, data.stocked - data.mortality)
      });
    }
  }

  getCageNameById(cageId: number): string {
    return this.cageIdNameMap[cageId] || `Cage ${cageId}`;
  }

  getAllStockingData(): { [date: string]: Fish[] } {
    return JSON.parse(localStorage.getItem('stockingDataByDate') || '{}');
  }

  getAllMortalityData(): { [date: string]: { cageId: number; mortality: number }[] } {
    const allRecords: Mortality[] = JSON.parse(localStorage.getItem('mortalityDataByDate') || '[]');

    const map: { [date: string]: { cageId: number; mortality: number }[] } = {};

    allRecords.forEach(record => {
      if (!map[record.date]) map[record.date] = [];

      const cageMortalityMap: { [cageId: number]: number } = {};

      record.entries.forEach(entry => {
        if (!entry.cageId) return;
        if (!cageMortalityMap[entry.cageId]) {
          cageMortalityMap[entry.cageId] = 0;
        }
        cageMortalityMap[entry.cageId] += entry.mortality || 0;
      });

      for (const cageId in cageMortalityMap) {
        map[record.date].push({
          cageId: Number(cageId),
          mortality: cageMortalityMap[cageId]
        });
      }
    });

    return map;
  }

  saveMortality(date: string, entries: { cageId: number; mortality: number }[]) {
    const existing: Mortality[] = JSON.parse(localStorage.getItem('mortalityDataByDate') || '[]');

    const newRecord: Mortality = {
      date,
      entries
    };

    // Replace any existing record for this date
    const updated = existing.filter(record => record.date !== date);
    updated.push(newRecord);

    localStorage.setItem('mortalityDataByDate', JSON.stringify(updated));
  }

  clearTableEntries() {
    const allData = this.getAllStockingData();
    const clearedFish: Fish[] = this.cages.map(cage => ({
      cageId: cage.id,
      species: '',
      qty: 0,
      date: new Date(this.balanceDate)
    }));

    allData[this.balanceDate] = clearedFish;
    localStorage.setItem('stockingDataByDate', JSON.stringify(allData));

    this.stockedFishSummary = clearedFish;
    this.calculateStockBalance();
  }

  goToBackPage() {
    this.router.navigate(['/mortality-registration']);
  }

  openPage() {
    this.router.navigate(['/basic-analysis']);
  }

  // *** ADD THESE HELPER METHODS TO SUPPORT THE TEMPLATE ***
  getStockedByCageId(cageId: number): number {
    const entry = this.stockBalanceList.find(e => e.cageId === cageId);
    return entry ? entry.stocked : 0;
  }

  getMortalityByCageId(cageId: number): number {
    const entry = this.stockBalanceList.find(e => e.cageId === cageId);
    return entry ? entry.mortality : 0;
  }

  getBalanceByCageId(cageId: number): number {
    const entry = this.stockBalanceList.find(e => e.cageId === cageId);
    return entry ? entry.balance : 0;
  }
}
