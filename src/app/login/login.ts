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
  invalidEmailError = false;
  agreed = false

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
  this.nameError = !this.name?.trim();
  this.emailError = !this.email?.trim();
  this.passwordError = !this.password;
  this.passwordMatchError = false;


  this.invalidEmailError = false;
  if (!this.emailError) {
     const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(this.email)) {
      this.invalidEmailError = true;
    }
  }

 
  if (this.nameError || this.emailError || this.invalidEmailError || this.passwordError) return;
  if (this.password !== this.confirmPassword) {
    this.passwordMatchError = true;
    return;
  }
  try {
    const user = await this.auth.signup(this.name, this.email, this.password);
    this.router.navigate(['/summary']);
  } catch (error: any) {
    console.error(error);
  }
}


  async guestLogin() {
    try {
      await this.auth.loginGuest();
      this.router.navigate(['/summary']);
    } catch (error: any) {
      console.error(error);
    }
  }
  
  openSignUp() {
    this.isSignUp = !this.isSignUp;
    this.loginError = false;
    this.passwordMatchError = false;
  }
}
