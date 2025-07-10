import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Stocking } from '../models/stocking.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private stockedFishSubject = new BehaviorSubject<Stocking[]>([]);
  stockedFish$ = this.stockedFishSubject.asObservable();

  addStockedFish(newFish: Stocking[]) {
    const current = this.stockedFishSubject.getValue();
    this.stockedFishSubject.next([...current, ...newFish]);
  }

  getFishByDate(date: Date): Stocking[] {
    const allFish: Stocking[] = JSON.parse(localStorage.getItem('stockedFish') || '[]');
    const targetDate = date.toISOString().slice(0, 10); // yyyy-mm-dd

    return allFish.filter(fish => {
      const fishDate = new Date(fish.date).toISOString().slice(0, 10);
      return fishDate === targetDate;
    });
  }
}
