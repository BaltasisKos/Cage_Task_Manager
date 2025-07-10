// import { Component, OnInit } from '@angular/core';
// import { FishTransferService, FishTransfer } from '../Service/fish-transfer.service';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { CageService } from '../Service/cage.service';
// import { Fish } from '../models/fish.model';

// @Component({
//   selector: 'app-fish-transfers',
//   templateUrl: './fish-transfers.component.html',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
// })
// export class FishTransfersComponent implements OnInit {
//   cages: any[] = [];
//   speciesList = ['Sparus Aurata', 'Dicentrarchus labrax', 'Pagrus pagrus', 'Trout', 'Tilapia'];
//   transfers: FishTransfer[] = [];
//   transferDate: string = this.getToday();
//   newTransfer: FishTransfer = this.resetNewTransfer();
//   cageIdNameMap: { [key: number]: string } = {};

//   showModal = false;
//   editIndex: number | null = null;

//   effectiveStock: Fish[] = [];  // <-- Effective stock combining stocking + transfers

//   constructor(
//     private cageService: CageService,
//     private fishTransferService: FishTransferService
//   ) {}

//   ngOnInit() {
//     this.cageService.cages$.subscribe(cages => {
//       this.cages = cages;
//       this.cageIdNameMap = {};
//       cages.forEach(c => (this.cageIdNameMap[c.id] = c.name));
//     });

//     this.loadTransfers();
//   }

//   getToday(): string {
//     return new Date().toISOString().split('T')[0];
//   }

//   resetNewTransfer(): FishTransfer {
//     return {
//       fromCageId: null,
//       toCageId: null,
//       species: '',
//       qty: null,
//       date: this.transferDate,
//     };
//   }

//   loadTransfers() {
//     this.transfers = this.fishTransferService.getTransfers();
//     this.loadEffectiveStock();
//   }

//   loadEffectiveStock() {
//     this.effectiveStock = this.fishTransferService.getEffectiveStockByDate(this.transferDate);
//   }

//   onDateChange(newDate: string) {
//     this.transferDate = newDate;
//     this.loadTransfers();
//   }

//   addTransfer() {
//     const t = this.newTransfer;

//     if (!t.fromCageId || !t.toCageId || !t.species || !t.qty || t.qty <= 0) {
//       alert('Please fill all fields with valid values.');
//       return;
//     }

//     if (t.fromCageId === t.toCageId) {
//       alert('From and To cages cannot be the same.');
//       return;
//     }

//     const transferWithDate: FishTransfer = {
//       ...t,
//       date: this.transferDate,
//     };

//     if (this.editIndex !== null) {
//       const filtered = this.getTransfersForSelectedDate();
//       const original = filtered[this.editIndex];
//       const globalIndex = this.transfers.findIndex(t => t === original);

//       if (globalIndex > -1) {
//         this.fishTransferService.updateTransfer(globalIndex, transferWithDate);
//       }
//     } else {
//       this.fishTransferService.addTransfer(transferWithDate);
//     }

//     this.newTransfer = this.resetNewTransfer();
//     this.editIndex = null;
//     this.closeModal();
//     this.loadTransfers();
//   }

//   removeTransferByDate(index: number) {
//     const filtered = this.getTransfersForSelectedDate();
//     const transferToRemove = filtered[index];
//     const globalIndex = this.transfers.findIndex(t => t === transferToRemove);

//     if (globalIndex > -1 && confirm('Are you sure you want to delete this transfer?')) {
//       this.fishTransferService.removeTransfer(globalIndex);
//       this.loadTransfers();
//     }
//   }

//   getCageName(id: number | null): string {
//     return id == null ? '' : this.cageIdNameMap[id] || 'Unknown';
//   }

//   getTransfersForSelectedDate(): FishTransfer[] {
//     return this.transfers.filter(t => t.date === this.transferDate);
//   }

//   getTotalQtyForSelectedDate(): number {
//     return this.getTransfersForSelectedDate().reduce((sum, t) => sum + (t.qty ?? 0), 0);
//   }

//   openModal(transfer?: FishTransfer, index?: number) {
//     if (transfer && index !== undefined) {
//       this.newTransfer = { ...transfer };
//       this.editIndex = index;
//     } else {
//       this.newTransfer = this.resetNewTransfer();
//       this.editIndex = null;
//     }
//     this.showModal = true;
//   }

//   closeModal() {
//     this.showModal = false;
//     this.newTransfer = this.resetNewTransfer();
//     this.editIndex = null;
//   }
// }
