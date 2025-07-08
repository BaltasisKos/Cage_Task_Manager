import { Component, OnInit } from '@angular/core';
import { CageService } from '../Service/cage.service';
import { MortalityService, MortalityEntry } from '../Service/mortality.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface CageFishEntry {
  cageId: number;
  cageName: string;
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
  cagesWithMortality: CageFishEntry[] = [];
  modalVisible = false;
  stockingDate: string = this.getToday();

  cageIdNameMap: { [key: number]: string } = {};
  editingCage: CageFishEntry | null = null;

  constructor(
    private cageService: CageService,
    private mortalityService: MortalityService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cageService.cages$.subscribe(cages => {
      this.cages = cages;
      this.cageIdNameMap = {};
      cages.forEach(c => this.cageIdNameMap[c.id] = c.name);
      this.loadCagesWithMortality();
    });
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  onDateChange() {
    this.loadCagesWithMortality();
  }

  loadCagesWithMortality() {
    const mortalityEntries = this.mortalityService.getMortalityByDate(new Date(this.stockingDate));
    this.cagesWithMortality = this.cages.map(cage => {
      const entry = mortalityEntries.find(m => m.cageId === cage.id);
      return {
        cageId: cage.id,
        cageName: cage.name,
        mortality: entry ? entry.mortality : null
      };
    });
  }

  openModal() {
    this.editingCage = null;
    this.loadCagesWithMortality();
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
    return this.cagesWithMortality.every(c => {
      const mortality = c.mortality ?? 0;
      return mortality <= 0;
    });
  }

  saveMortality() {
    const mortalityEntries: MortalityEntry[] = this.cagesWithMortality
      .filter(c => c.mortality != null && c.mortality > 0)
      .map(c => ({
        cageId: c.cageId,
        cageName: this.getCageNameById(c.cageId),
        species: '', // Species removed, can leave empty or remove field from model
        stockedQty: 0,
        mortality: c.mortality ?? 0,
        date: this.stockingDate
      }));

    this.mortalityService.saveMortality(new Date(this.stockingDate), mortalityEntries);
    this.loadCagesWithMortality();
    this.closeModal();
  }

  openEditModal(entry: CageFishEntry) {
    this.editingCage = {
      cageId: entry.cageId,
      cageName: entry.cageName,
      mortality: entry.mortality ?? 0
    };
    this.modalVisible = true;
  }

  getCageNameById(cageId: number): string {
    return this.cageIdNameMap[cageId] || 'Unknown';
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

  clearTableEntries() {
  // Get all records from localStorage through service logic (we can create a method in service)
  const allRecords: { date: string; entries: MortalityEntry[] }[] = JSON.parse(localStorage.getItem('mortalityRecords') || '[]');

  const targetDate = this.stockingDate;

  // Prepare cleared entries for all cages with mortality = 0
  const clearedEntries: MortalityEntry[] = this.cages.map(cage => ({
    cageId: cage.id,
    cageName: cage.name,
    mortality: 0,
    date: targetDate,
    species: '',      // optional or empty if unused
    stockedQty: 0     // optional or 0 if unused
  }));

  // Remove existing record for this date if any
  const filteredRecords = allRecords.filter(record => record.date !== targetDate);

  // Add the cleared entries record for this date
  filteredRecords.push({ date: targetDate, entries: clearedEntries });

  // Save back to localStorage
  localStorage.setItem('mortalityRecords', JSON.stringify(filteredRecords));

  // Update the service subject by reloading data
  this.mortalityService.saveMortality(new Date(targetDate), clearedEntries);

  // Update local state
  this.cagesWithMortality = clearedEntries;

  // Close modal if open
  this.modalVisible = false;
}


}
