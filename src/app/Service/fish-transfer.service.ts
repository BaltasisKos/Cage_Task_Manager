// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';
// import { Stocking } from '../models/stocking.model';

// export interface FishTransfer {
//   fromCageId: number | null;
//   toCageId: number | null;
//   species: string;
//   qty: number | null;
//   date: string;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class FishTransferService {
//   private localStorageKey = 'fishTransfers';
//   transfersUpdated$ = new BehaviorSubject<void>(undefined);

//   getTransfers(): FishTransfer[] {
//     return JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
//   }

//   saveTransfers(transfers: FishTransfer[]) {
//     localStorage.setItem(this.localStorageKey, JSON.stringify(transfers));
//     this.transfersUpdated$.next(); // notify listeners
//   }

//   addTransfer(transfer: FishTransfer) {
//     const transfers = this.getTransfers();
//     transfers.push(transfer);
//     this.saveTransfers(transfers);
//   }

//   updateTransfer(index: number, updated: FishTransfer) {
//     const transfers = this.getTransfers();
//     if (index >= 0 && index < transfers.length) {
//       transfers[index] = updated;
//       this.saveTransfers(transfers);
//     }
//   }

//   removeTransfer(index: number) {
//     const transfers = this.getTransfers();
//     if (index >= 0 && index < transfers.length) {
//       transfers.splice(index, 1);
//       this.saveTransfers(transfers);
//     }
//   }

//   /**
//    * Combines stocking data and fish transfers up to a given date
//    * and returns the final stock status by cage and species.
//    */
//   getEffectiveStockByDate(dateStr: string): Stocking[] {
//     const stockingData: { [date: string]: Stocking[] } = JSON.parse(
//       localStorage.getItem('stockingDataByDate') || '{}'
//     );
//     const transfers: FishTransfer[] = this.getTransfers();

//     const cumulativeStock: { [key: string]: Partial<Stocking> } = {};

//     // Step 1: Accumulate stocking up to date
//     for (const [date, fishList] of Object.entries(stockingData)) {
//       if (date <= dateStr) {
//         for (const fish of fishList) {
//           const key = `${fish.cageId}_${fish.species}`;
//           if (!cumulativeStock[key]) {
//             cumulativeStock[key] = { ...fish };
//           } else {
//             cumulativeStock[key].qty = (cumulativeStock[key].qty || 0) + (fish.qty || 0);
//           }
//         }
//       }
//     }

//     // Step 2: Apply all transfers up to date
//     for (const transfer of transfers) {
//       if (transfer.date <= dateStr && transfer.qty && transfer.species) {
//         const fromKey = `${transfer.fromCageId}_${transfer.species}`;
//         const toKey = `${transfer.toCageId}_${transfer.species}`;

//         if (!cumulativeStock[fromKey]) {
//           cumulativeStock[fromKey] = {
//             cageId: transfer.fromCageId!,
//             species: transfer.species,
//             qty: 0,
//             date: new Date(dateStr),
//           };
//         }

//         if (!cumulativeStock[toKey]) {
//           cumulativeStock[toKey] = {
//             cageId: transfer.toCageId!,
//             species: transfer.species,
//             qty: 0,
//             date: new Date(dateStr),
//           };
//         }

//         cumulativeStock[fromKey].qty = (cumulativeStock[fromKey].qty || 0) - (transfer.qty || 0);
//         cumulativeStock[toKey].qty = (cumulativeStock[toKey].qty || 0) + (transfer.qty || 0);
//       }
//     }

//     // Step 3: Return filtered and sorted final stock
//    function isCompleteStocking(obj: Partial<Stocking>): obj is Stocking {
//   return (
//     typeof obj.id === 'number' &&
//     typeof obj.cageId === 'number' &&
//     typeof obj.species === 'string' &&
//     typeof obj.qty === 'number' &&
//     obj.date instanceof Date &&
//     obj.fishCount !== undefined
//   );
// }

// return Object.values(cumulativeStock)
//   .filter(isCompleteStocking)
//   .filter(f => f.qty !== undefined && f.qty > 0)
//   .sort((a, b) => a.cageId - b.cageId || a.species.localeCompare(b.species));

//   }
// }
