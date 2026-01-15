import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

/**
 * Helper/Tutorial Component
 * 
 * Displays application help information and user guide. Provides instructions
 * for using the Join task management system with navigation back to main application.
 * 
 * Features:
 * - Help content and tutorials
 * - Back button to return to previous page
 * - Static informational display
 * 
 * @component
 * @selector app-helper
 * @standalone true
 */
@Component({
  selector: 'app-helper',
  imports: [CommonModule],
  templateUrl: './helper.html',
  styleUrl: './helper.scss',
})
export class Helper {

  constructor(private location: Location) {}

  /**
   * Navigates back to the previous page
   * Uses browser history to return to prior route
   * 
   * @returns {void}
   */
  backToSite() {
    this.location.back();
  }
}
