import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
isSignUp = false
  constructor(private router: Router) {}

  guestLogin() {
  // Nach Klick auf Guest Login → Summary anzeigen
  this.router.navigate(['/summary']);

}
openSignUp() {
    this.isSignUp = !this.isSignUp;
  }



}
