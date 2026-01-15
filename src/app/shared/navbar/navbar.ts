import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { CommonModule } from '@angular/common';
import { AuthService } from '../../firebase-services/auth-services';

/**
 * Navigation Sidebar Component
 * 
 * Fixed sidebar navigation displaying main application routes and current user info.
 * Provides access to all major sections of the application: Summary, Board,
 * Contacts, Add Task, Helper, and legal/policy pages.
 * 
 * Features:
 * - Main navigation links to all sections
 * - Current route highlighting
 * - User initials/avatar display
 * - Responsive behavior (collapses on mobile via CSS)
 * - Integration with authentication service
 * 
 * Navigation Routes:
 * - Summary: Dashboard overview
 * - Board: Task kanban board
 * - Contacts: Contact management
 * - Add Task: Quick task creation
 * - Helper: Application help/tutorial
 * - Privacy Policy: Privacy information
 * - Legal Notice: Legal information
 * 
 * @component
 * @selector app-navbar
 * @standalone true
 */
@Component({
  selector: 'app-navbar',
  standalone:true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  authService = inject(AuthService);
  user$ = this.authService.currentUser$;
}
