import { Component, HostListener, OnInit, inject } from '@angular/core';
import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../firebase-services/auth-services';
import { FirebaseServices } from '../../firebase-services/firebase-services';

/**
 * Application Header Component
 * 
 * Displays top navigation bar with breadcrumbs, current route information,
 * and user menu. Provides logout and navigation controls.
 * 
 * Features:
 * - Responsive header with current page context
 * - User menu dropdown for logout and settings
 * - Mobile-friendly menu toggle
 * - Breadcrumb navigation
 * - Quick access to main sections
 * - Current user information display
 * 
 * @component
 * @selector app-header
 * @standalone true
 * @implements {OnInit}
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header implements OnInit {
  /**
   * Injected Firebase services for accessing application data
   * 
   * @type {FirebaseServices}
   */
  firebase = inject(FirebaseServices);

  /**
   * Tracks whether the user menu is currently open/visible
   * Controls display of menu dropdown for logout and other actions
   * 
   * @type {boolean}
   */
  menuOpen = false;

  /**
   * Toggles the user menu visibility state
   * 
   * Switches menuOpen between true and false. Called when user clicks
   * the menu icon/button in the header.
   * 
   * @returns {void}
   * 
   * @example
   * this.toggleMenu();
   * // Menu visibility is toggled
   */
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  /**
   * Closes the user menu
   * 
   * Sets menuOpen to false to hide the menu dropdown.
   * Called after menu action or when clicking outside menu.
   * 
   * @returns {void}
   */
  closeMenu() {
    this.menuOpen = false;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  /**
   * Navigates guest user back to login page
   * 
   * Used for guest logout button. Routes to /Login page.
   * 
   * @returns {void}
   */
  guestLogin() {
    this.router.navigate(['/Login']);
  }

  /**
   * Logs out the current user
   * 
   * Closes the menu dropdown and calls AuthService logout method
   * which handles Firebase signout and user cleanup.
   * 
   * @async
   * @returns {Promise<void>} Resolves when logout completes
   * 
   * @example
   * await this.onLogout();
   * // User is logged out and redirected
   */
  async onLogout() {
    this.closeMenu();
    await this.authService.logout();
  }

  /**
   * Host listener for document-wide click events
   * 
   * Closes the menu when user clicks outside of it.
   * Prevents menu from staying open when clicking on other elements.
   * 
   * @param {MouseEvent} event - The click event from document
   * @returns {void}
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (this.menuOpen) {
      const clickedInsideMenu = target.closest('.menu, .menu-mobil');

      const clickedOnMenuIcon = target.closest('.menu-icon');

      if (!clickedInsideMenu && !clickedOnMenuIcon) {
        this.menuOpen = false;
      }
    }
  }

  /**
   * Tracks whether the application is running on a mobile device
   * Updated on component initialization
   * 
   * @type {boolean}
   */
  isMobile: boolean = false;

  /**
   * Angular OnInit lifecycle hook
   * 
   * Initializes the component by checking the current screen width and setting
   * the isMobile flag appropriately. This ensures the header renders correctly
   * for the current device type on initial load.
   * 
   * @returns {void}
   */
  ngOnInit() {
    this.checkScreenWidth();
  }

  /**
   * Window resize event listener
   * 
   * Decorated with @HostListener to respond to window resize events.
   * Checks screen width each time window is resized to update mobile state
   * and adapt header layout responsively.
   * 
   * @returns {void}
   */
  @HostListener('window:resize')
  onResize() {
    this.checkScreenWidth();
  }

  /**
   * Determines if the current viewport is mobile-sized
   * 
   * Checks the window inner width and sets isMobile flag to true if width is
   * 1050px or less. Used to conditionally render mobile vs desktop header layouts.
   * 
   * @returns {void}
   * 
   * @example
   * // Check screen width on init or resize
   * this.checkScreenWidth();
   * // isMobile is set to true for screens <= 1050px
   */
  checkScreenWidth() {
    this.isMobile = window.innerWidth <= 1050;
  }
}
