import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Fish } from '../models/fish.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private stockedFishSubject = new BehaviorSubject<Fish[]>([]);
  stockedFish$ = this.stockedFishSubject.asObservable();

  addStockedFish(newFish: Fish[]) {
    const current = this.stockedFishSubject.getValue();
    this.stockedFishSubject.next([...current, ...newFish]);
  }

  getFishByDate(date: Date): Fish[] {
    const allFish: Fish[] = JSON.parse(localStorage.getItem('stockedFish') || '[]');
    const targetDate = date.toISOString().slice(0, 10); // yyyy-mm-dd

    return allFish.filter(fish => {
      const fishDate = new Date(fish.date).toISOString().slice(0, 10);
      return fishDate === targetDate;
    });
  }
}
