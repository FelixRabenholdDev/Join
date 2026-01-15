import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogEditContact } from './dialog-edit-contact/dialog-edit-contact';
import { Contact } from '../../../../interfaces/contact.interface';
import { FirebaseServices } from '../../../../firebase-services/firebase-services';
import { UserUiService } from '../../../../services/user-ui.service';
import { Router } from '@angular/router';

/**
 * Single Contact Component (Detail View)
 * 
 * Right panel displaying detailed information for a selected contact.
 * Allows editing contact information, viewing assigned tasks,
 * and deleting contacts. Uses signal-based reactivity for optimal performance.
 * 
 * Features:
 * - Contact name, email, phone display
 * - Edit contact dialog
 * - Delete contact with confirmation
 * - Show tasks assigned to contact
 * - Contact color indicator
 * - User action menu (edit, delete)
 * - Real-time contact data from Firestore
 * 
 * Input:
 * - contactId: Required signal input for contact to display
 * 
 * @component
 * @selector app-single-contact
 * @standalone true
 * @changeDetection OnPush (optimized)
 */
@Component({
  selector: 'app-single-contact',
  standalone: true,
  imports: [CommonModule,DialogEditContact, FormsModule],
  templateUrl: './single-contact.html',
  styleUrl: './single-contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleContact {
  /**
   * Required input signal for the contact ID to display
   * Changes trigger updates to the contact$ computed signal
   * 
   * @type {Signal<string>}
   */
  contactId = input.required<string>();

  private readonly firebase = inject(FirebaseServices);
  public readonly userUi = inject(UserUiService);
  private readonly router = inject(Router);

  /**
   * Reference to the dialog for editing contact information
   * Controlled to open/close via this reference
   * 
   * @type {DialogEditContact}
   */
  @ViewChild(DialogEditContact) dialogEditContact!: DialogEditContact;

  /**
   * Computed signal for fetching the current contact data from Firestore
   * Automatically updates when contactId input changes
   * Returns Observable<Contact | undefined> if contact not found
   * 
   * @type {Signal<Observable<Contact | undefined>>}
   */
  readonly contact$ = computed(() =>
    this.firebase.subSingleContact(this.contactId())
  );

  /**
   * Tracks if the action menu (edit/delete) is open
   * 
   * @type {boolean}
   */
  isMenuOpen = false;

  /**
   * Toggles the visibility of the action menu (edit/delete options)
   * 
   * Switches the isMenuOpen state to show or hide the context menu
   * with edit and delete actions for the current contact.
   * Used when user clicks the menu button (three dots icon).
   * 
   * @returns {void}
   * 
   * @example
   * // Toggle action menu visibility
   * this.toggleMenu();
   * // isMenuOpen is toggled: true becomes false, false becomes true
   */
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Closes the action menu
   * 
   * Hides the context menu with edit and delete options.
   * Typically called after an action is selected or when clicking elsewhere.
   * 
   * @returns {void}
   * 
   * @example
   * // Close the action menu
   * this.closeMenu();
   * // isMenuOpen becomes false
   */
  closeMenu() {
    this.isMenuOpen = false;
  }

  /**
   * Deletes the current contact from Firestore with error handling
   * 
   * Attempts to delete the contact via FirebaseServices. Handles specific error cases:
   * - Permission denied: Shows alert if trying to delete another registered user
   * - Requires recent login: Shows alert for account deletion requiring re-authentication
   * - Other errors: Logs to console
   * 
   * After successful deletion, the component automatically updates due to computed signal
   * or parent component handles navigation/refresh.
   * 
   * @async
   * @returns {Promise<void>}
   * 
   * @throws {Error} Throws errors from FirebaseServices for unhandled cases
   * 
   * @example
   * // Delete the current contact
   * await this.deleteContact();
   * // Contact removed from Firestore, UI updates
   * // If permission denied: Shows user-friendly alert
   */
  async deleteContact(): Promise<void> {
    try {
    await this.firebase.deleteContact(this.contactId());
  } catch (error: any) {
    if (error.message === 'auth/permission-denied') {
      alert('You cannot delete other registered users!');
    } else if (error.code === 'auth/requires-recent-login') {
      alert('Please log in again to delete your account.');
      this.router.navigate(['/Login']);
    } else {
      console.error('An error occurred:', error);
    }
  }
  }

  /**
   * Opens the edit dialog with contact information pre-populated
   * 
   * Closes the action menu, creates a copy of the contact data,
   * populates the dialog's edit model, and opens the modal.
   * Prevents data mutation by spreading the contact object.
   * 
   * @param {Contact} contact - Contact object with id, name, email, phone, color properties
   * 
   * @returns {void}
   * 
   * @throws {Error} Will throw if dialogEditContact ViewChild is not initialized
   * 
   * @example
   * // Open edit dialog for a contact
   * const contact = { id: '123', name: 'John', email: 'john@example.com', phone: '555-1234', color: '#FF5733' };
   * this.openEdit(contact);
   * // Dialog opens with contact data pre-filled
   */
  openEdit(contact: Contact): void {
    this.closeMenu();
    this.dialogEditContact.editModel = { ...contact };
    this.dialogEditContact.open();
  }
}
