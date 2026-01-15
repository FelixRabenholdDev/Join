import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Header } from '../../shared/header/header';

/**
 * Main Page Container Component
 * 
 * Serves as the main layout container for authenticated users. Provides the
 * primary layout structure with sidebar navigation (navbar) and main content area.
 * Routes all authenticated pages through this component.
 * 
 * Layout Structure:
 * - Left: Navbar (navigation sidebar)
 * - Right:
 *   - Top: Header (breadcrumbs, user info)
 *   - Center: Router outlet for page content
 * 
 * This is the parent component for all authenticated routes including:
 * - Board (task kanban)
 * - Contacts (contact management)
 * - Summary (dashboard)
 * - Add-Task, Helper, Privacy Policy, Legal Notice
 * 
 * @component
 * @selector app-main-page
 * @standalone true
 * @imports [RouterOutlet, Navbar, Header]
 */
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
