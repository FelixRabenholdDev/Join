import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../firebase-services/auth-services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  isSignUp = false;
  loginError = false;
  passwordMatchError = false;

  constructor(private auth: AuthService, private router: Router, private cd: ChangeDetectorRef) {}

  

  async login() {
    this.loginError = false;
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/summary']);
    } catch (error: any) {
      console.error(error);
      this.loginError = true;
      this.cd.detectChanges();
    }
  }

  async signup() {
    this.passwordMatchError = false;
    if (this.password !== this.confirmPassword) {
      this.passwordMatchError = true;
      return;
    }
    try {
      const user = await this.auth.signup(this.name, this.email, this.password);
      this.router.navigate(['/summary']);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  }

  async guestLogin() {
    try {
      await this.auth.loginGuest();
      this.router.navigate(['/summary']);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    }
  }
  
  openSignUp() {
    this.isSignUp = !this.isSignUp;
    this.loginError = false;
    this.passwordMatchError = false;
  }
}
