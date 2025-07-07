import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Cage } from '../models/cage.model';

@Injectable({ providedIn: 'root' })
export class CageService {
  private cagesSubject = new BehaviorSubject<Cage[]>([]);
  cages$ = this.cagesSubject.asObservable();

  getCages(): Cage[] {
    return this.cagesSubject.value;
  }

  getCageById(id: number): Cage | undefined {
    return this.cagesSubject.value.find(cage => cage.id === id);
  }

  addCage(cage: Cage): void {
    const updated = [...this.getCages(), cage];
    this.cagesSubject.next(updated);
  }

  updateCage(updated: Cage): void {
    const updatedCages = this.getCages().map(cage =>
      cage.id === updated.id ? updated : cage
    );
    this.cagesSubject.next(updatedCages);
  }

  deleteCage(id: number): void {
    const updatedCages = this.getCages().filter(cage => cage.id !== id);
    this.cagesSubject.next(updatedCages);
  }

  setCages(cages: Cage[]): void {
    this.cagesSubject.next(cages);
  }

  clear(): void {
    this.cagesSubject.next([]);
  }
}
