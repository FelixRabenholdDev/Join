import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal, ViewChild } from '@angular/core';
import { SingleContact } from './single-contact/single-contact';
import { ListContact } from './list-contact/list-contact';

/**
 * Contacts Management Component
 * 
 * Provides a two-panel interface for managing application contacts.
 * Left panel displays list of all contacts, right panel shows detailed
 * view and editing capabilities for selected contact.
 * 
 * Features:
 * - Contact list with selection
 * - Detailed contact view/edit panel
 * - Responsive layout (responsive design adapts for mobile)
 * - Add/edit/delete contact operations via SingleContact component
 * - Contact navigation with back button
 * 
 * State Management:
 * - Uses Angular signals for reactive state (selectedContactId)
 * - Communicates with child components via methods
 * 
 * @component
 * @selector app-contacts
 * @standalone true
 * @changeDetection OnPush (optimized change detection)
 */
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, ListContact, SingleContact],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Contacts {
  /**
   * Reference to the list contact child component
   * Used to trigger navigation actions like returnArrow
   * 
   * @type {ListContact}
   */
  @ViewChild(ListContact) listContact!: ListContact;

  /**
   * Reactive signal tracking the currently selected contact ID
   * Null when no contact is selected or user clicked back
   * Updated when user selects a contact from the list
   * 
   * @type {Signal<string | null>}
   */
  selectedContactId = signal<string | null>(null);

  /**
   * Sets the currently selected contact for detailed view
   * 
   * Updates the selectedContactId signal to trigger the right panel
   * to display details for the selected contact. Called when user
   * clicks on a contact in the list.
   * 
   * @param {string} id - Firestore contact document ID
   * @returns {void}
   * 
   * @example
   * this.setSelectedContact('contact-123');
   * // Right panel now shows details for contact-123
   */
  setSelectedContact(id: string) {
    this.selectedContactId.set(id);
  }

  /**
   * Clears selected contact and triggers back navigation
   * 
   * Resets the selectedContactId to null (showing no contact details)
   * and calls returnArrow on the ListContact child component to handle
   * any cleanup or UI state changes in the contact list.
   * 
   * @returns {void}
   * 
   * @example
   * this.returnArrow();
   * // Selected contact is cleared, list goes to previous view
   */
  returnArrow(): void {
    this.selectedContactId.set(null);
    if (this.listContact) {
      this.listContact.returnArrow();
    }
  }
}
