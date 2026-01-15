import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  ViewChild,
  Output,
  EventEmitter,
  signal
} from '@angular/core';
import { FirebaseServices } from '../../../../../firebase-services/firebase-services';
import { Contact } from '../../../../../interfaces/contact.interface';
import { FormsModule, NgForm } from '@angular/forms';
import { Dialog } from '../../../../../shared/dialog/dialog';
import { UserUiService } from '../../../../../services/user-ui.service';

/**
 * Add New Contact Dialog Component
 * 
 * Modal dialog for creating new contacts in the system. Automatically assigns
 * a color from the user color palette and validates contact information.
 * Emits contactSelected event when new contact is created.
 * 
 * Features:
 * - Contact name, email, phone input
 * - Automatic color assignment from palette
 * - Form validation
 * - Create and close operations
 * - Emits contactSelected event with contact ID
 * - Modal dialog interface
 * 
 * @component
 * @selector app-dialog-add-new-contact
 * @standalone true
 */
@Component({
  selector: 'app-dialog-add-new-contact',
  imports: [CommonModule, FormsModule, Dialog],
  templateUrl: './dialog-add-new-contact.html',
  styleUrl: './dialog-add-new-contact.scss',
  standalone: true,
})

export class DialogAddNewContact {
  private readonly firebase = inject(FirebaseServices);
  private readonly userUi = inject(UserUiService);

  /**
   * Event emitted when a new contact is successfully created
   * Emits the ID of the newly created contact
   * 
   * @output
   * @type {EventEmitter<string>}
   */
  @Output() contactSelected = new EventEmitter<string>();

  /**
   * Reference to the add contact dialog component
   * Controlled to open/close via this reference
   * 
   * @type {Dialog}
   */
  @ViewChild('DialogAddNewContact') addDialog!: Dialog;

  /**
   * Model for contact being edited/created
   * Updated with form values before submission
   * 
   * @type {Partial<Contact>}
   */
  editModel: Partial<Contact> = {};

  /**
   * Reactive signal for new contact form data
   * Contains name, email, phone, and assigned color
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
   * Tracks the ID of the selected contact (if any)
   * 
   * @type {Signal<string | null>}
   */
  selectedContactId = signal<string | null>(null);

  /**
   * Gets initials from a contact name
   * 
   * Delegates to UserUiService to extract initials for avatar display.
   * 
   * @param {string} name - Contact name
   * 
   * @returns {string} Initials (e.g., "JD" for "John Doe")
   */
  getInitials(name: string): string {
    return this.userUi.getInitials(name);
  }

  /**
   * Opens the add new contact dialog with color pre-assigned
   * 
   * Retrieves the next available color from the color palette, resets the form
   * with empty values and the assigned color, and opens the modal dialog.
   * Color is automatically rotated for visual variety.
   * 
   * @async
   * @returns {Promise<void>}
   * 
   * @throws {Error} Will throw if UserUiService.getNextColorIndex() fails
   * 
   * @example
   * // Open dialog to create new contact
   * await this.open();
   * // Dialog opens with empty form and rotated color assigned
   */
  async open(): Promise<void> {

    const colorIndex = await this.userUi.getNextColorIndex();
    const colorHex = this.userUi.getColorByIndex(colorIndex);

    this.formModel.set({
      name: '',
      email: '',
      phone: '',
      color: colorHex,
    });
    this.addDialog.open();
  }

  /**
   * Validates and saves a new contact to Firestore
   * 
   * Checks that form is valid before saving. If valid, trims all input values,
   * creates the contact in Firestore, closes the dialog, and displays
   * a confirmation message. If form is invalid, does nothing.
   * 
   * @async
   * @param {NgForm} form - Angular form group with contact data
   * 
   * @returns {Promise<void>}
   * 
   * @throws {Error} Will throw if FirebaseServices.addContact() fails
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
    this.addDialog.close();
    this.writeConfirmation();
  } 

  /**
   * Displays a confirmation message toast to the user
   * 
   * Selects the confirmation container element and adds the active class
   * to trigger the confirmation notification display. Toast auto-hides
   * after a CSS-defined timeout.
   * 
   * @returns {void}
   * 
   * @throws {Error} Will throw if confirmation_container element not found in DOM
   * 
   * @example
   * // Show success confirmation
   * this.writeConfirmation();
   * // Confirmation toast appears
   */
  writeConfirmation(): void {
    const container = document.querySelector('.confirmation_container') as HTMLElement;
    container.classList.add('confirmation_container--active');
  }
}
