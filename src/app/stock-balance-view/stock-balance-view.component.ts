import { Component, OnInit } from '@angular/core';
import { CageService } from '../Service/cage.service';
import { StockService } from '../Service/stock.service';
import { Fish } from '../models/fish.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface CageStockBalance {
  cageId: number;
  cageName: string;
  species: string;
  stocked: number;
  mortality: number;
  balance: number;
}

@Component({
  selector: 'app-stock-balance-view',
  templateUrl: './stock-balance-view.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class StockBalanceViewComponent implements OnInit {
  cages: any[] = [];
  cageIdNameMap: { [key: number]: string } = {};
  
  stockedFishSummary: Fish[] = [];
  stockBalanceList: CageStockBalance[] = [];

  modalVisible = false;
  editingCage: any = null;

  stockingDate: string = this.getToday();
  balanceDate: string = this.getToday();

  speciesList = ['Sparus Aurata', 'Dicentrarchus labrax', 'Pagrus pagrus', 'Trout', 'Tilapia'];
  showStockingSummary = false;

  constructor(
    private cageService: CageService,
    private stockService: StockService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cageService.cages$.subscribe(cages => {
      this.cages = cages;
      this.cageIdNameMap = {};
      cages.forEach(c => this.cageIdNameMap[c.id] = c.name);

      this.loadCagesWithStock();
      this.loadSummaryForDate(this.stockingDate);
      this.calculateStockBalance();
    });
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  onDateChange() {
    this.loadSummaryForDate(this.stockingDate);
    this.loadCagesWithStock();
    this.calculateStockBalance();
  }

  loadCagesWithStock() {
    const allData = this.getAllStockingData();
    const stockedFishForDate = allData[this.stockingDate] || [];

    // Only cages that exist
    this.stockedFishSummary = this.cages.map(cage => {
      const fishEntry = stockedFishForDate.find(f => f.cageId === cage.id);
      return {
        cageId: cage.id,
        species: fishEntry ? fishEntry.species : '',
        qty: fishEntry ? fishEntry.qty : 0,
        date: new Date(this.stockingDate)
      };
    });
  }

  openModal() {
    this.editingCage = null;
    this.loadCagesWithStock();
    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
    this.editingCage = null;
  }

  isSaveDisabled(): boolean {
    if (this.editingCage) {
      return !this.editingCage.species.trim() || !this.editingCage.qty || this.editingCage.qty <= 0;
    }
    return this.stockedFishSummary.every(c => !c.species.trim() || !c.qty || c.qty <= 0);
  }

  saveStocking() {
    const allData = this.getAllStockingData();
    const existingList = allData[this.stockingDate] || [];

    if (this.editingCage) {
      const updatedList = existingList.map(entry =>
        entry.cageId === this.editingCage.cageId
          ? {
              cageId: this.editingCage.cageId,
              species: this.editingCage.species,
              qty: this.editingCage.qty,
              date: new Date(this.stockingDate)
            }
          : entry
      );
      allData[this.stockingDate] = updatedList;
      this.editingCage = null;
    } else {
      const validEntries = this.stockedFishSummary.filter(
        c => c.species.trim() !== '' && c.qty !== null && c.qty > 0
      );

      if (validEntries.length === 0) {
        alert('Please fill species and quantity for at least one cage.');
        return;
      }

      const fishToAdd: Fish[] = validEntries.map(entry => ({
        cageId: entry.cageId,
        species: entry.species,
        qty: entry.qty,
        date: new Date(this.stockingDate)
      }));

      allData[this.stockingDate] = fishToAdd;
    }

    this.saveToLocalStorage(this.stockingDate, allData[this.stockingDate]);
    this.loadSummaryForDate(this.stockingDate);
    this.calculateStockBalance();
    this.closeModal();
  }

  openEditModal(fish: Fish) {
    this.editingCage = {
      cageId: fish.cageId,
      cageName: this.getCageNameById(fish.cageId),
      species: fish.species,
      qty: fish.qty
    };
    this.modalVisible = true;
  }

  clearTableEntries() {
    const allData = this.getAllStockingData();

    const clearedFish: Fish[] = this.cages.map(cage => ({
      cageId: cage.id,
      species: '',
      qty: 0,
      date: new Date(this.stockingDate)
    }));

    allData[this.stockingDate] = clearedFish;
    localStorage.setItem('stockingDataByDate', JSON.stringify(allData));

    this.stockedFishSummary = clearedFish;
    this.showStockingSummary = true;
    this.calculateStockBalance();
  }

  getAllStockingData(): { [date: string]: Fish[] } {
    return JSON.parse(localStorage.getItem('stockingDataByDate') || '{}');
  }

  getAllMortalityData(): { [date: string]: { cageId: number; species: string; mortality: number }[] } {
    return JSON.parse(localStorage.getItem('mortalityDataByDate') || '{}');
  }

  getCageNameById(cageId: number): string {
    return this.cageIdNameMap[cageId] || 'Unknown';
  }

  saveToLocalStorage(date: string, fishList: Fish[]) {
    const allData = this.getAllStockingData();
    allData[date] = fishList;
    localStorage.setItem('stockingDataByDate', JSON.stringify(allData));
  }

  loadSummaryForDate(date: string) {
    const allData = this.getAllStockingData();
    const stockedFish = allData[date] || [];

    // Only cages that exist
    this.stockedFishSummary = this.cages.map(cage => {
      const match = stockedFish.find(f => f.cageId === cage.id);
      return {
        cageId: cage.id,
        species: match ? match.species : '',
        qty: match ? match.qty : 0,
        date: new Date(date)
      };
    });

    this.showStockingSummary = true;
  }

  calculateStockBalance() {
  const selectedDate = new Date(this.balanceDate);
  const stockingData = this.getAllStockingData();

  // Map cageId -> { stocked: number; mortality: number }
  const balanceMap: { [cageId: number]: { stocked: number; mortality: number } } = {};

  // Aggregate stocked qty and mortality by cageId for all dates <= selectedDate
  for (const dateStr in stockingData) {
    const date = new Date(dateStr);
    if (date <= selectedDate) {
      for (const entry of stockingData[dateStr]) {
        if (!this.cageIdNameMap[entry.cageId]) continue; // Skip unknown cages

        if (!balanceMap[entry.cageId]) {
          balanceMap[entry.cageId] = { stocked: 0, mortality: 0 };
        }

        balanceMap[entry.cageId].stocked += Number(entry.qty) || 0;
        balanceMap[entry.cageId].mortality += Number(entry.mortality) || 0;
      }
    }
  }

  // Prepare final list — one entry per cage
  this.stockBalanceList = [];

  for (const cageIdStr in balanceMap) {
    const cageId = +cageIdStr;
    const data = balanceMap[cageId];

    this.stockBalanceList.push({
      cageId,
      cageName: this.getCageNameById(cageId),
      species: 'All Species',
      stocked: data.stocked,
      mortality: data.mortality,
      balance: Math.max(0, data.stocked - data.mortality),
    });
  }
}
  goToBackPage() {
    this.router.navigate(['/mortality-registration']);
  }

  openPage() {
    this.router.navigate(['/basic-analysis'])
  }
}


