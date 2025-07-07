import { Component, OnInit } from '@angular/core';
import { CageService } from '../Service/cage.service';
import { StockService } from '../Service/stock.service';
import { MortalityService, MortalityEntry } from '../Service/mortality.service';
import { Fish } from '../models/fish.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BasicAnalysisService } from '../Service/basic-analysis.service';

interface CageFishEntry {
  cageId: number;
  cageName: string;
  species: string;
  qty: number | null;
  mortality?: number | null;
}

@Component({
  selector: 'app-mortality-registration',
  templateUrl: './mortality-registration.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MortalityRegistrationComponent implements OnInit {
  cages: any[] = [];
  cagesWithStock: CageFishEntry[] = [];
  modalVisible = false;
  stockingDate: string = this.getToday();

  showStockingSummary = false;
  stockedFishSummary: Fish[] = [];


  cageIdNameMap: { [key: number]: string } = {};

  editingCage: CageFishEntry | null = null;

  constructor(
    private cageService: CageService,
    private stockService: StockService,
    private mortalityService: MortalityService,
    private router: Router,
    private basicAnalysisService: BasicAnalysisService
  ) {}

  ngOnInit() {
    this.cageService.cages$.subscribe(cages => {
      this.cages = cages;
      this.cageIdNameMap = {};
      cages.forEach(c => this.cageIdNameMap[c.id] = c.name);
      this.loadCagesWithStock();
      this.loadSummaryForDate(this.stockingDate);
    });
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  onDateChange() {
    this.loadSummaryForDate(this.stockingDate);
    this.loadCagesWithStock();
  }

  loadCagesWithStock() {
    const allData = this.getAllStockingData();
    const stockedFishForDate = allData[this.stockingDate] || [];

    const mortalityEntries = this.mortalityService.getMortalityByDate(new Date(this.stockingDate));

    this.cagesWithStock = this.cages.map(cage => {
      const stockEntry = stockedFishForDate.find(f => f.cageId === cage.id);
      const mortalityEntry = mortalityEntries.find(m => m.cageId === cage.id);

      return {
        cageId: cage.id,
        cageName: cage.name,
        species: stockEntry ? stockEntry.species : '',
        qty: stockEntry ? stockEntry.qty : null,
        mortality: mortalityEntry ? mortalityEntry.mortality : null
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
      return this.editingCage.mortality == null || this.editingCage.mortality < 0;
    }
    return this.cagesWithStock.every(c => {
      const mortality = c.mortality ?? 0;
      return mortality <= 0;
    });
  }

  saveStocking() {
    const allData = this.getAllStockingData();
    const existingList = allData[this.stockingDate] || [];

    if (this.editingCage) {
      const updatedList = existingList.map(entry =>
        entry.cageId === this.editingCage!.cageId
          ? {
              cageId: this.editingCage!.cageId,
              species: this.editingCage!.species,
              qty: this.editingCage!.qty!,
              mortality: this.editingCage!.mortality ?? 0,
              date: new Date(this.stockingDate)
            }
          : entry
      );
      allData[this.stockingDate] = updatedList;
    } else {
      const validEntries = this.cagesWithStock.filter(
        c => c.species.trim() !== '' && c.qty !== null && c.qty > 0
      );

      if (validEntries.length === 0) {
        alert('Please fill species and quantity for at least one cage.');
        return;
      }

      const fishToAdd: Fish[] = validEntries.map(entry => ({
        cageId: entry.cageId,
        species: entry.species,
        qty: entry.qty!,
        mortality: entry.mortality ?? 0,
        date: new Date(this.stockingDate)
      }));

      allData[this.stockingDate] = fishToAdd;
    }

    this.saveToLocalStorage(this.stockingDate, allData[this.stockingDate]);

    const mortalityEntries: MortalityEntry[] = allData[this.stockingDate].map(fish => ({
      cageId: fish.cageId,
      cageName: this.getCageNameById(fish.cageId),
      species: fish.species,
      stockedQty: fish.qty ?? 0,
      mortality: fish.mortality ?? 0,
      date: this.stockingDate
    }));

    this.mortalityService.saveMortality(new Date(this.stockingDate), mortalityEntries);

    this.loadSummaryForDate(this.stockingDate);
    this.loadCagesWithStock();

    this.editingCage = null;
    this.closeModal();
  }

  openEditModal(fish: Fish) {
    this.editingCage = {
      cageId: fish.cageId,
      cageName: this.getCageNameById(fish.cageId),
      species: fish.species,
      qty: fish.qty,
      mortality: fish.mortality ?? 0
    };
    this.modalVisible = true;
  }

  clearTableEntries() {
    const allData = this.getAllStockingData();

    const clearedFish: Fish[] = Object.keys(this.cageIdNameMap).map(id => ({
      cageId: +id,
      species: '',
      qty: 0,
      mortality: 0,
      date: new Date(this.stockingDate)
    }));

    allData[this.stockingDate] = clearedFish;
    localStorage.setItem('stockingDataByDate', JSON.stringify(allData));

    this.stockedFishSummary = clearedFish;
    this.showStockingSummary = true;
  }

  getAllStockingData(): { [date: string]: Fish[] } {
    return JSON.parse(localStorage.getItem('stockingDataByDate') || '{}');
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

    const mortalityEntries = this.mortalityService.getMortalityByDate(new Date(date));

    this.stockedFishSummary = this.cages.map(cage => {
      const match = stockedFish.find(f => f.cageId === cage.id);
      const mortality = mortalityEntries.find(m => m.cageId === cage.id)?.mortality ?? 0;

      return {
        cageId: cage.id,
        species: match ? match.species : '',
        qty: match ? match.qty : 0,
        mortality: mortality,
        date: new Date(date)
      };
    });

    this.stockedFishSummary = [...this.stockedFishSummary];
    this.showStockingSummary = this.stockedFishSummary.length > 0;
  }

 hasMortalityRecorded(): boolean {
  const mortalityEntries = this.mortalityService.getMortalityByDate(new Date(this.stockingDate));
  
  return mortalityEntries.some(entry => entry.mortality != null && entry.mortality > 0);
}

  goToBackPage() {
    this.router.navigate(['/fish-stocking']);
  }

  goToNextPage() {
    if (this.hasMortalityRecorded()) {
    this.router.navigate(['/stock-balance-view']);
  }
}
}
