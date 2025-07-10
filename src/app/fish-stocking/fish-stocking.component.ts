import { Component, OnInit } from '@angular/core';
import { CageService } from '../Service/cage.service';
import { StockService } from '../Service/stock.service';
import { EditableStocking, Stocking } from '../models/stocking.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BasicAnalysisService } from '../Service/basic-analysis.service';
import { Router } from '@angular/router';
// import { FishTransferService } from '../Service/fish-transfer.service';


@Component({
  selector: 'app-fish-stocking',
  templateUrl: './fish-stocking.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FishStockingComponent implements OnInit {
  cages: any[] = [];
  cagesWithStock: EditableStocking[] = [];
  modalVisible = false;
  stockingDate: string = this.getToday();

  showStockingSummary = false;
  stockedFishSummary: Stocking[] = [];



  speciesList = ['Sparus Aurata', 'Dicentrarchus labrax', 'Pagrus pagrus', 'Trout', 'Tilapia'];

  cageIdNameMap: { [key: number]: string } = {};

  editingCage: EditableStocking | null = null;



  constructor(
    private cageService: CageService,
    private stockService: StockService,
    private basicAnalysisService: BasicAnalysisService,
    // private fishTransferService: FishTransferService,
    private router: Router
  ) {}



  ngOnInit() {
    this.cageService.cages$.subscribe(cages => {
      this.cages = cages;
      this.cageIdNameMap = {};
      cages.forEach(c => this.cageIdNameMap[c.id] = c.name);
      this.loadCagesWithStock();
      this.loadSummaryForDate(this.stockingDate);
      this.updateMonthlyStockingData();
    });
//     this.fishTransferService.transfersUpdated$.subscribe(() => {
//   this.loadSummaryForDate(this.stockingDate);
//   this.updateMonthlyStockingData();
// });

  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  onDateChange() {
    this.loadSummaryForDate(this.stockingDate);
    this.loadCagesWithStock();
    this.updateMonthlyStockingData();
  }

  loadCagesWithStock() {
    const allData = this.getAllStockingData();
    const stockedFishForDate = allData[this.stockingDate] || [];

    this.cagesWithStock = this.cages.map(cage => {
      const fishEntry = stockedFishForDate.find(f => f.cageId === cage.id);

      return {
        cageId: cage.id,
        cageName: cage.name,
        species: fishEntry ? fishEntry.species : '',
        qty: fishEntry ? fishEntry.qty : null,
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
    return this.cagesWithStock.every(c => !c.species.trim() || !c.qty || c.qty <= 0);
  }

  saveStocking() {
    const allData = this.getAllStockingData();
    const existingList = allData[this.stockingDate] || [];

    if (this.editingCage) {
      // Editing existing entry
      const updatedList = existingList.map(entry =>
        entry.cageId === this.editingCage!.cageId
          ? {
              cageId: this.editingCage!.cageId,
              species: this.editingCage!.species,
              qty: this.editingCage!.qty!,
              date:this.stockingDate,
              stockedQty: this.editingCage!.qty!,
              fishCount: this.editingCage!.qty!
            }
          : entry
      );
      allData[this.stockingDate] = updatedList;
      this.editingCage = null;
    } else {
      // Adding new entries
      const validEntries = this.cagesWithStock.filter(
        c => c.species.trim() !== '' && c.qty !== null && c.qty > 0
      );

      if (validEntries.length === 0) {
        alert('Please fill species and quantity for at least one cage.');
        return;
      }

      const fishToAdd: Stocking[] = validEntries.map(entry => ({
        cageId: entry.cageId,
        species: entry.species,
        qty: entry.qty!,
        date:this.stockingDate,
        stockedQty: entry.qty!, // You may adjust this logic
  fishCount: entry.qty!
      }));

      allData[this.stockingDate] = fishToAdd;
    }

    this.saveToLocalStorage(this.stockingDate, allData[this.stockingDate]);
    this.loadSummaryForDate(this.stockingDate);
    this.updateMonthlyStockingData(); // <-- update monthly data after save

    
    this.closeModal();
  }

  openEditModal(fish: Stocking) {
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

    const clearedFish: Stocking[] = Object.keys(this.cageIdNameMap).map(id => ({
      cageId: +id,
      species: '',
      qty: 0,
      date:this.stockingDate,
      stockedQty: 0,
      fishCount: 0
    }));

    allData[this.stockingDate] = clearedFish;
    localStorage.setItem('stockingDataByDate', JSON.stringify(allData));

    this.stockedFishSummary = clearedFish;
    this.showStockingSummary = true;
    this.updateMonthlyStockingData(); // <-- update monthly data on clear
  }

  getAllStockingData(): { [date: string]: Stocking[] } {
    return JSON.parse(localStorage.getItem('stockingDataByDate') || '{}');
  }

  getCageNameById(cageId: number): string {
    return this.cageIdNameMap[cageId] || 'Unknown';
  }

  saveToLocalStorage(date: string, fishList: Stocking[]) {
    const allData = this.getAllStockingData();
    allData[date] = fishList;
    localStorage.setItem('stockingDataByDate', JSON.stringify(allData));
  }

  loadSummaryForDate(date: string) {
   const allData = this.getAllStockingData(); 
  this.stockedFishSummary = allData[date] || []
  this.showStockingSummary = true;
}


  // NEW: Aggregates monthly stocking qty and pushes to AnalysisDataService
  updateMonthlyStockingData() {
    const allData = this.getAllStockingData();
    const monthlyTotals = new Array(12).fill(0);

    for (const dateStr in allData) {
      if (allData.hasOwnProperty(dateStr)) {
        const date = new Date(dateStr);
        const monthIndex = date.getMonth();
        const fishList = allData[dateStr];

        fishList.forEach(fish => {
          monthlyTotals[monthIndex] += fish.qty || 0;
        });
      }
    }

    // Send aggregated data to the shared service
    this.basicAnalysisService.updateStockingData(monthlyTotals);
  }

  hasFishAdded(): boolean {
  
  const hasInSummary = this.stockedFishSummary.some(fish =>
    fish.qty && fish.qty > 0 && fish.species && fish.species.trim() !== ''
  );

  return  hasInSummary;
}



  goToBackPage() {
    this.router.navigate(['/cage-management']);
  }

  goToNextPage() {
    if (this.hasFishAdded()) {
    this.router.navigate(['/mortality-registration']);
  }
}
}
