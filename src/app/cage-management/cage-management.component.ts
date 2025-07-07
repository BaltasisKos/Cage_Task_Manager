import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CageService } from '../Service/cage.service';
import { Cage } from '../models/cage.model';

@Component({
  selector: 'app-cage-management',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './cage-management.component.html',
  styleUrls: ['./cage-management.component.css']
})
export class CageManagementComponent {
@ViewChild('cageInput') cageInputRef!: ElementRef;

  cages: Cage[] = [];
  modalVisible = false;
  isEditing = false;
  editingCage: Cage | null = null;
  cageNameInput = '';

  private nextId = 1;

  constructor(private cageService: CageService) {
    this.cageService.cages$.subscribe(cages => {
      this.cages = cages;

      // Keep nextId higher than any existing id to avoid duplicates
      const maxId = cages.length ? Math.max(...cages.map(c => c.id)) : 0;
      this.nextId = maxId + 1;
    });
  }

  openCreateModal() {
    this.isEditing = false;
    this.cageNameInput = '';
    this.modalVisible = true;
    setTimeout(() => {
      this.cageInputRef?.nativeElement?.focus();
    });
  }

  openEditModal(cage: Cage) {
    this.isEditing = true;
    this.editingCage = cage;
    this.cageNameInput = cage.name;
    this.modalVisible = true;

    setTimeout(() => {
      this.cageInputRef?.nativeElement?.focus();
    });
  }

  
  save() {
    if (!this.cageNameInput.trim()) return;
    

    if (this.isEditing && this.editingCage) {
      this.cageService.updateCage({ ...this.editingCage, name: this.cageNameInput.trim() });
    } else {
      const newCage: Cage = {
        id: this.nextId++,
        name: this.cageNameInput.trim(),
        status: 'Empty'
      };
      this.cageService.addCage(newCage);
    }

    this.closeModal();
  }

  deleteCage(id: number) {
    const stockedFish: any[] = JSON.parse(localStorage.getItem('stockedFish') || '[]');
  const updatedFish = stockedFish.filter(f => f.cageId !== id);
  localStorage.setItem('stockedFish', JSON.stringify(updatedFish));

    this.cageService.deleteCage(id);
  }

  closeModal() {
    this.modalVisible = false;
    this.editingCage = null;
    this.cageNameInput = '';
  }
}
