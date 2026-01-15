import { CommonModule } from '@angular/common';
import { Component, inject, signal, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { FirebaseServices } from '../../../../firebase-services/firebase-services';
import { Contact } from '../../../../interfaces/contact.interface';
import { map } from 'rxjs/operators';
import { Dialog } from '../../../../shared/dialog/dialog';
import { DialogAddNewContact } from './dialog-add-new-contact/dialog-add-new-contact';
import { UserUiService } from '../../../../services/user-ui.service';

/**
 * Contact List Component
 * 
 * Left panel displaying all application contacts grouped alphabetically by name.
 * Allows selection of contacts for detailed viewing, adding new contacts,
 * and managing contact list.
 * 
 * Features:
 * - Alphabetically grouped contact list
 * - Search/filter contacts
 * - Select contact to view details
 * - Add new contact dialog
 * - Contact color indicator
 * - Responsive layout (collapses on mobile)
 * - Real-time updates from Firestore
 * 
 * Display:
 * - Contacts grouped by first letter (A-Z)
 * - Contact name with initials and color
 * - Add new contact button
 * 
 * @component
 * @selector app-list-contact
 * @standalone true
 */
@Component({
  selector: 'app-list-contact',
  imports: [CommonModule, FormsModule, DialogAddNewContact],
  templateUrl: './list-contact.html',
  styleUrl: './list-contact.scss',
})
export class ListContact {
  /**
   * Event emitted when a contact is selected from the list
   * Emits the contact ID of the selected contact
   * 
   * @output
   * @type {EventEmitter<string>}
   */
  @Output() contactSelected = new EventEmitter<string>();

  /**
   * Reference to the add new contact dialog component
   * Controlled to open/close via this reference
   * 
   * @type {Dialog}
   */
  @ViewChild(DialogAddNewContact) DialogAddNewContact!: Dialog;

  private readonly firebase = inject(FirebaseServices);
  public readonly userUi = inject(UserUiService);

  /**
   * Tracks if contact list is currently displayed (not hidden on mobile)
   * 
   * @type {boolean}
   */
  isDisplayed = true;

  /**
   * Media query matcher for mobile breakpoint (max-width: 1050px)
   * Used to determine if the application is in mobile view
   * 
   * @type {MediaQueryList}
   */
  isMediacheck = window.matchMedia('(max-width: 1050px)');

  /**
   * Temporary model for new contact being created
   * Populated by form before submission
   * 
   * @type {Partial<Contact>}
   */
  editModel: Partial<Contact> = {};

  /**
   * Reactive signal for new contact form data
   * Controls the form inputs for adding new contact
   * 
   * @type {Signal<Partial<Contact>>}
   */
  formModel = signal<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    color: '#000',
  });

  /**
   * Tracks the currently selected contact ID from the list
   * Used for template binding to show/hide detail panel
   * 
   * @type {Signal<string | null>}
   */
  selectedContactId = signal<string | null>(null);

  /**
   * Observable stream of contacts grouped and sorted by first letter
   * Updated in real-time from Firestore
   * 
   * @type {Observable<{letter: string, contacts: Contact[]}[]>}
   */
  readonly groupedContacts$ = this.firebase
    .subContactsList()
    .pipe(map((contacts: Contact[]) => this.sortAndGroup(contacts)));

  /**
   * Hides the contact list on mobile devices based on media query
   * 
   * Checks if the viewport is in mobile mode (max-width: 1050px) and if the list
   * is currently displayed. If both conditions are true, hides the list. This is used
   * for responsive design to switch from two-column layout to single column on smaller screens.
   * 
   * @returns {void}
   * 
   * @example
   * // Hide contact list on mobile when needed
   * this.dnoneList();
   * // isDisplayed becomes false if in mobile view
   */
  dnoneList(): void {
    if (this.isMediacheck.matches && this.isDisplayed) {
      this.isDisplayed = false;
    } else {
      return;
    }
  }

  /**
   * Selects a contact from the list and hides the list on mobile
   * 
   * Updates the selectedContactId signal with the chosen contact ID, hides the list
   * on mobile devices for better UX, and emits the contactSelected event to parent component.
   * Parent component typically listens for this event to show the contact detail panel.
   * 
   * @param {string} id - The unique identifier of the contact to select
   * 
   * @returns {void}
   * 
   * @throws {Error} Will throw if contact ID is not found in Firestore
   * 
   * @example
   * // Select a contact when user clicks on it
   * this.onSelectContact('contact-123');
   * // selectedContactId signal updated, contactSelected event emitted
   */
  onSelectContact(id: string) {
    this.dnoneList();
    this.selectedContactId.set(id);
    this.contactSelected.emit(id);
  }

  /**
   * Shows the contact list and hides the contact detail view
   * 
   * Used when the user clicks the back arrow on the contact detail panel.
   * Restores the contact list visibility to its default state on mobile devices.
   * This enables navigation between list and detail views on smaller screens.
   * 
   * @returns {void}
   * 
   * @example
   * // Navigate back from contact detail to list
   * this.returnArrow();
   * // isDisplayed becomes true, list is visible again
   */
  returnArrow(): void {
    this.isDisplayed = true;
  }

  /**
   * Groups and sorts contacts alphabetically by first letter of name
   * 
   * Creates a structured array of contact groups, each grouped by the first letter
   * of the contact's name in uppercase. Groups are sorted alphabetically, and contacts
   * within each group maintain their original order. Used to display contacts in sections
   * (A, B, C, etc.) in the UI.
   * 
   * @param {Contact[]} contacts - Array of contacts to group and sort
   * 
   * @returns {{letter: string; contacts: Contact[]}[]} Array of grouped contacts,
   *          each with a letter property and array of contacts starting with that letter.
   *          Returns empty array if input is empty.
   * 
   * @throws {Error} Will throw if contact name property is missing or malformed
   * 
   * @example
   * // Group contacts alphabetically
   * const grouped = this.sortAndGroup([
   *   { id: '1', name: 'Alice', email: 'alice@example.com', phone: '123', color: '#FFF' },
   *   { id: '2', name: 'Bob', email: 'bob@example.com', phone: '456', color: '#FFF' },
   *   { id: '3', name: 'Alice Junior', email: 'alice.jr@example.com', phone: '789', color: '#FFF' }
   * ]);
   * // Returns:
   * // [
   * //   { letter: 'A', contacts: [Alice, Alice Junior] },
   * //   { letter: 'B', contacts: [Bob] }
   * // ]
   */
  private sortAndGroup(contacts: Contact[]): { letter: string; contacts: Contact[] }[] {
    const groups: Record<string, Contact[]> = {};

    for (const c of contacts) {
      const letter = c.name.trim().charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    }

    return Object.keys(groups)
      .sort()
      .map((letter) => ({
        letter,
        contacts: groups[letter],
      }));
  }

  /**
   * Initializes the add contact dialog with a new color from the color rotation
   * 
   * Retrieves the next available color from the user UI service (rotates through
   * predefined colors), resets the form model, and opens the DialogAddNewContact modal.
   * Prepares an empty contact form with the assigned color for user input.
   * 
   * @async
   * @returns {Promise<void>}
   * 
   * @throws {Error} Will throw if UserUiService.getNextColorIndex() fails
   * 
   * @example
   * // Open dialog to add new contact
   * await this.onAddContact();
   * // Dialog opens with empty form and rotated color assigned
   */
  async onAddContact() {
    const colorIndex = await this.userUi.getNextColorIndex();
    const colorHex = this.userUi.getColorByIndex(colorIndex);

    this.formModel.set({ name: '', email: '', phone: '', color: colorHex });
    this.DialogAddNewContact.open();
  }

  /**
   * Validates and saves a new contact to Firestore
   * 
   * Validates the provided NgForm for required fields and proper format. If valid,
   * trims all input values, saves the contact via FirebaseServices, closes the dialog,
   * and displays a confirmation message to the user. If form is invalid, does nothing.
   * 
   * @async
   * @param {NgForm} form - Angular form group with contact data (name, email, phone, color)
   * 
   * @returns {Promise<void>}
   * 
   * @throws {Error} Will throw if FirebaseServices.addContact() fails (e.g., Firestore error)
   * 
   * @example
   * // Save new contact after form submission
   * await this.saveNewContact(contactForm);
   * // Contact saved to Firestore, dialog closed, confirmation shown
   * // If form invalid: returns early without saving
   */
  async saveNewContact(form: NgForm): Promise<void> {
    if (!form.valid) return;
    const data = this.formModel();

    await this.firebase.addContact({
      name: data.name?.trim() ?? '',
      email: data.email?.trim() ?? '',
      phone: data.phone?.trim() ?? '',
      color: data.color ?? '#000',
    });
    this.DialogAddNewContact.close();
    this.writeConfirmation();
  }

  /**
   * Displays a confirmation message to the user after successful action
   * 
   * Selects the confirmation container element from the DOM and adds the active class
   * to display a toast/notification message. Used after contact creation, edit, or deletion
   * to provide visual feedback to the user. The confirmation typically auto-hides after a delay
   * via CSS animation/timeout.
   * 
   * @returns {void}
   * 
   * @throws {Error} Will throw if confirmation_container element is not found in DOM
   * 
   * @example
   * // Show confirmation after saving
   * this.writeConfirmation();
   * // Confirmation toast appears with active state
   */
  writeConfirmation(): void {
    const container = document.querySelector('.confirmation_container') as HTMLElement;
    container.classList.add('confirmation_container--active');
  }
}
