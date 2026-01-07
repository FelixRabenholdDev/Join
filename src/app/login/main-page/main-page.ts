import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Header } from '../../shared/header/header';


@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [RouterOutlet,Navbar,Header],
  template: `    <div class="content">
      <app-navbar></app-navbar>

      <div class="right_wrapper">
        <app-header></app-header>

        <div class="router_wrapper">
          <router-outlet />
        </div>
      </div>
    </div>`,
    styleUrl: './main-page.scss'
})
export class MainPage {}
