import { Component, OnInit } from '@angular/core';
import { CageService } from '../Service/cage.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FishTransfer {
  fromCageId: number | null;
  toCageId: number | null;
  species: string;
  qty: number | null;
  date: string;
}

@Component({
  selector: 'app-fish-transfers',
  templateUrl: './fish-transfers.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class FishTransfersComponent implements OnInit {
  cages: any[] = [];
  speciesList = ['Tilapia', 'Salmon', 'Catfish', 'Sparus Aurata', 'Dicentrarchus labrax'];
  transfers: FishTransfer[] = [];
  transferDate: string = this.getToday();
  newTransfer: FishTransfer = this.resetNewTransfer();
  cageIdNameMap: { [key: number]: string } = {};

  // Modal & edit tracking
  showModal = false;
  editIndex: number | null = null;

  constructor(private cageService: CageService) {}

  ngOnInit() {
    this.cageService.cages$.subscribe(cages => {
      this.cages = cages;
      this.cageIdNameMap = {};
      cages.forEach(c => (this.cageIdNameMap[c.id] = c.name));
      this.loadTransfers();
    });
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  resetNewTransfer(): FishTransfer {
    return {
      fromCageId: null,
      toCageId: null,
      species: '',
      qty: null,
      date: this.transferDate,
    };
  }

  loadTransfers() {
    const stored = localStorage.getItem('fishTransfers');
    this.transfers = stored ? JSON.parse(stored) : [];
  }

  saveTransfers() {
    localStorage.setItem('fishTransfers', JSON.stringify(this.transfers));
  }

  addTransfer() {
    if (
      !this.newTransfer.fromCageId ||
      !this.newTransfer.toCageId ||
      !this.newTransfer.species ||
      !this.newTransfer.qty ||
      this.newTransfer.qty <= 0
    ) {
      alert('Please fill all fields with valid values.');
      return;
    }

    if (this.newTransfer.fromCageId === this.newTransfer.toCageId) {
      alert('From and To cages cannot be the same.');
      return;
    }

    const transferWithDate = { ...this.newTransfer, date: this.transferDate };

    if (this.editIndex !== null) {
      // Edit existing transfer
      const filteredTransfers = this.getTransfersForSelectedDate();
      const original = filteredTransfers[this.editIndex];
      const globalIndex = this.transfers.findIndex(t => t === original);

      if (globalIndex > -1) {
        this.transfers[globalIndex] = transferWithDate;
      }
    } else {
      // Add new transfer
      this.transfers.push(transferWithDate);
    }

    this.saveTransfers();
    this.newTransfer = this.resetNewTransfer();
    this.editIndex = null;
    this.closeModal();
  }

  removeTransferByDate(index: number) {
    const filtered = this.getTransfersForSelectedDate();
    const transferToRemove = filtered[index];
    const globalIndex = this.transfers.findIndex(t => t === transferToRemove);

    if (globalIndex > -1 && confirm('Are you sure you want to delete this transfer?')) {
      this.transfers.splice(globalIndex, 1);
      this.saveTransfers();
    }
  }

  getCageName(id: number | null): string {
    if (id == null) return '';
    return this.cageIdNameMap[id] || 'Empty';
  }

  getTransfersForSelectedDate(): FishTransfer[] {
    return this.transfers.filter(t => t.date === this.transferDate);
  }

  getTotalQtyForSelectedDate(): number {
    return this.getTransfersForSelectedDate()
      .reduce((sum, t) => sum + (t.qty ?? 0), 0);
  }

  openModal(transfer?: FishTransfer, index?: number) {
    if (transfer && index !== undefined) {
      this.newTransfer = { ...transfer };
      this.editIndex = index;
    } else {
      this.newTransfer = this.resetNewTransfer();
      this.editIndex = null;
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.newTransfer = this.resetNewTransfer();
    this.editIndex = null;
  }
}
