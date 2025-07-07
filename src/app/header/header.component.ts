import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  constructor(private router: Router) {}

  Logout(): void {
    localStorage.removeItem('authToken'); // Clear auth token or session data
    this.router.navigate(['/login']);      // Redirect to login page
    console.log('User logged out');
  }
}
