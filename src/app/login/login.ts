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
  nameError = false;
  emailError = false;
  passwordMatchError = false;
  passwordError = false
  passwordTooShortError = false;
  invalidEmailError = false;
  agreed = false
 emailTakenError = false;

  constructor(private auth: AuthService, private router: Router, private cd: ChangeDetectorRef) {}  

  async login() {
    this.loginError = false;
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/summary']);
    } catch (error: any) {
      this.loginError = true;
      this.cd.detectChanges();
    }
  }

async signup() {
  
  this.nameError = !this.name?.trim();
  this.emailError = !this.email?.trim();
  this.invalidEmailError = false;
  this.passwordError = !this.password;
  this.passwordTooShortError = false;
  this.passwordMatchError = false;
  this.emailTakenError = false;
 
  if (!this.emailError) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(this.email)) {
      this.invalidEmailError = true;
    }
  }
  
  if (!this.passwordError && this.password.length < 6) {
    this.passwordTooShortError = true;
  }
  
  if (!this.passwordError && !this.passwordTooShortError && this.password !== this.confirmPassword) {
    this.passwordMatchError = true;
  }

  if (
    this.nameError ||
    this.emailError ||
    this.invalidEmailError ||
    this.passwordError ||
    this.passwordTooShortError ||
    this.passwordMatchError
  ) return;
  
  try {
    const user = await this.auth.signup(this.name, this.email, this.password);
    this.router.navigate(['/summary']);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use' || error.message?.includes('already in use')) {
      this.emailTakenError = true;
      this.cd.detectChanges();
    } else {
      console.error(error);
    }
  }
}

  async guestLogin() {
    try {
      await this.auth.loginGuest();
      this.router.navigate(['/summary']);
    } catch (error: any) {}
  }
  
  openSignUp() {
    this.isSignUp = !this.isSignUp;
    this.loginError = false;
    this.passwordMatchError = false;
  }
}
