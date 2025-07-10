import { Component, OnInit } from '@angular/core';
import { CageService } from '../Service/cage.service';
import { MortalityService } from '../Service/mortality.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MortalityEntry } from '../models/mortality.model';

@Component({
  selector: 'app-mortality-registration',
  templateUrl: './mortality-registration.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MortalityRegistrationComponent implements OnInit {
  cages: any[] = [];
  cagesWithMortality: MortalityEntry[] = [];
  modalVisible = false;
  mortalityDate: string = this.getToday();
  cageIdNameMap: { [key: number]: string } = {};
  editingCage: MortalityEntry | null = null;

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
    this.mortalityService.getMortalityByDate(new Date(this.mortalityDate)).then(entries => {
      // Map cages with existing mortality or create new defaults
      this.cagesWithMortality = this.cages.map(cage => {
        const match = entries.find(e => e.cageId === cage.id);
        return match ? { ...match } : {
          cageId: cage.id,
          cageName: cage.name,
          mortality: 0,
          date: this.mortalityDate,
          species: '',
          stockedQty: 0,
          entries: 0
        };
      });
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

  async saveMortality() {
    const validEntries = this.cagesWithMortality.filter(c => c.mortality != null && c.mortality > 0);

    if (validEntries.length === 0) {
      alert('Please enter at least one mortality entry.');
      return;
    }

    await this.mortalityService.saveMortality(new Date(this.mortalityDate), validEntries);
    this.loadCagesWithMortality();
    this.closeModal();
  }

  openEditModal(entry: MortalityEntry) {
    this.editingCage = { ...entry };
    this.modalVisible = true;
  }

  getCageNameById(cageId: number): string {
    return this.cageIdNameMap[cageId] || 'Unknown';
  }

  async hasMortalityRecorded(): Promise<boolean> {
    const entries = await this.mortalityService.getMortalityByDate(new Date(this.mortalityDate));
    return entries.some(entry => entry.mortality && entry.mortality > 0);
  }

  goToBackPage() {
    this.router.navigate(['/fish-stocking']);
  }

  async goToNextPage() {
    if (await this.hasMortalityRecorded()) {
      this.router.navigate(['/stock-balance-view']);
    }
  }

  async clearTableEntries() {
    const clearedEntries: MortalityEntry[] = this.cages.map(cage => ({
      cageId: cage.id,
      cageName: cage.name,
      mortality: 0,
      date: this.mortalityDate,
      species: '',
      stockedQty: 0,
      entries: 0
    }));

    await this.mortalityService.saveMortality(new Date(this.mortalityDate), clearedEntries);
    this.loadCagesWithMortality();
    this.modalVisible = false;
  }
}
