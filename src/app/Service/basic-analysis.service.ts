import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BasicAnalysisService {
  private mortalityDataSubject = new BehaviorSubject<number[]>([]);
  mortalityData$ = this.mortalityDataSubject.asObservable();

  private stockingDataSubject = new BehaviorSubject<number[]>([]);
  stockingData$ = this.stockingDataSubject.asObservable();

  updateMortalityData(data: number[]) {
    this.mortalityDataSubject.next(data);
  }

  updateStockingData(data: number[]) {
    this.stockingDataSubject.next(data);
  }
}
