import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent {
  isLeftSidebarCollapsed = input.required<boolean>();
  screenWidth = input.required<number>();
 sizeClass = computed(() => {
  return this.isLeftSidebarCollapsed()
    ? 'body-md-screen' // sidebar collapsed = small margin
    : this.screenWidth() > 768
      ? 'body-trimmed' // sidebar expanded on desktop
      : 'body-md-screen'; // fallback for small screen
});
}