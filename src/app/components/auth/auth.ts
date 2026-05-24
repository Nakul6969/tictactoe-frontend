import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Component, NgZone } from '@angular/core';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent {
  // Login form data
  loginData = { email: '', password: '' };

  // Register form data
  registerData = { username: '', email: '', password: '' };

  isLoading = false;

  constructor(
  private authService: AuthService,
  private router: Router,
  private snackBar: MatSnackBar,
  private ngZone: NgZone          // ← add this
) {}

  login() {
  this.isLoading = true;
  this.authService.login(this.loginData).subscribe({
    next: () => {
      this.isLoading = false;
      console.log('Login success, navigating to /game...');  // ← add this
      console.log('Token:', localStorage.getItem('token'));   // ← add this
      this.ngZone.run(() => {
        this.router.navigate(['/game']).then(result => {
          console.log('Navigation result:', result);          // ← add this
        });
      });
    },
    error: (err) => {
      console.log('Login error:', err);
      this.snackBar.open(err.error.message || 'Login failed', 'Close', { duration: 3000 });
      this.isLoading = false;
    }
  });
}
register() {
  this.isLoading = true;
  this.authService.register(this.registerData).subscribe({
    next: () => {
      this.isLoading = false;
      this.snackBar.open('Registered successfully!', 'Close', { duration: 2000 });
      this.ngZone.run(() => this.router.navigate(['/game']));
    },
    error: (err) => {
      this.snackBar.open(err.error.message || 'Registration failed', 'Close', { duration: 3000 });
      this.isLoading = false;
    }
  });
}
}