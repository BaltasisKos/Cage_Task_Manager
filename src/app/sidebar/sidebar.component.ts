import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  isLeftSidebarCollapsed = input.required<boolean>();
  changeIsLeftSidebarCollapsed = output<boolean>();
  items = [
  
  {
    routeLink: 'cage-management',
    icon: 'bi bi-bullseye',
    label: 'Cage Management',
  },
  {
    routeLink: 'fish-stocking',
    icon: 'fa-solid fa-cubes',
    label: 'Fish Stocking',
  },
  {
    routeLink: 'mortality-registration',
    icon: 'fa-solid fa-fish',
    label: 'Mortality Registration',
  },
  {
    routeLink: 'stock-balance-view',
    icon: 'fa-solid fa-scale-unbalanced-flip',
    label: 'Stock Balance View',
  },
  {
    routeLink: 'basic-analysis',
    icon: 'fa-solid fa-chart-line',
    label: 'Basic Analysis',
  },
  {
    routeLink: 'fish-transfers',
    icon: 'fa-solid fa-right-left',
    label: 'Fish Transfers',
  },
  
];

  toggleCollapse(): void {
    this.changeIsLeftSidebarCollapsed.emit(!this.isLeftSidebarCollapsed());
  }

  closeSidenav(): void {
    this.changeIsLeftSidebarCollapsed.emit(true);
  }
}