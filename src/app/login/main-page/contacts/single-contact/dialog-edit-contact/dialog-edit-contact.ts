import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, ViewChild } from '@angular/core';
import { FirebaseServices } from '../../../../../firebase-services/firebase-services';
import { Contact } from '../../../../../interfaces/contact.interface';
import { FormsModule, NgForm } from '@angular/forms';
import { Dialog } from '../../../../../shared/dialog/dialog';
import { UserUiService } from '../../../../../services/user-ui.service';

/**
 * Edit Contact Dialog Component
 * 
 * Modal dialog for editing existing contact information or deleting contacts.
 * Allows modification of name, email, and phone fields with form validation.
 * Provides menu for delete action with confirmation.
 * 
 * Features:
 * - Edit contact name, email, phone
 * - Form validation
 * - Delete contact with action menu
 * - Modal dialog interface
 * - Action menu (more options)
 * 
 * @component
 * @selector app-dialog-edit-contact
 * @standalone true
 * @changeDetection OnPush (optimized)
 */
@Component({
  selector: 'app-dialog-edit-contact',
  imports: [CommonModule, FormsModule, Dialog],
  templateUrl: './dialog-edit-contact.html',
  styleUrl: './dialog-edit-contact.scss',
  standalone: true,
})
export class DialogEditContact {
  private readonly firebase = inject(FirebaseServices);
  public readonly userUi = inject(UserUiService);

  /**
   * Reference to the edit dialog modal component
   * Controlled to open/close via this reference
   * 
   * @type {Dialog}
   */
  @ViewChild('editDialog') editDialog!: Dialog;

  /**
   * Contact data being edited
   * Partially populated with current contact information
   * Must include id for save/delete operations
   * 
   * @type {Partial<Contact>}
   */
  editModel: Partial<Contact> = {};

  /**
   * Opens the edit contact dialog modal
   * 
   * Displays the dialog with current editModel contact data pre-filled in form fields.
   * 
   * @returns {void}
   * 
   * @example
   * // Open dialog with contact to edit
   * this.open();
   * // Dialog becomes visible
   */
  open() {
    this.editDialog.open();
  }

  /**
   * Saves edited contact information to Firestore
   * 
   * Validates that contact has ID and form is valid before saving.
   * If validation passes, updates contact in Firestore and closes dialog.
   * Does nothing if form is invalid or contact ID is missing.
   * 
   * @async
   * @param {NgForm} form - Angular form group containing contact fields
   * 
   * @returns {Promise<void>}
   * 
   * @throws {Error} Will throw if Firestore update fails
   * 
   * @example
   * // Save changes to existing contact
   * await this.saveEdit(contactForm);
   * // Contact updated in Firestore, dialog closed
   */
  async saveEdit(form: NgForm): Promise<void> {
    if (!this.editModel.id || !form.valid) return;
    await this.firebase.editContact(this.editModel as Contact);
    this.editDialog.close();
  }

  /**
   * Deletes the contact from Firestore and closes dialog
   * 
   * Validates that contact has ID before deletion. Closes action menu,
   * deletes contact from Firestore, and closes the edit dialog.
   * Does nothing if contact ID is missing.
   * 
   * @async
   * @returns {Promise<void>}
   * 
   * @throws {Error} Will throw if Firestore delete fails
   * 
   * @example
   * // Delete current contact
   * await this.deleteContact();
   * // Contact removed from Firestore, dialog closed
   */
  async deleteContact(): Promise<void> {
    const id = this.editModel.id;
    if (!id) return;
    this.closeMenu();
    await this.firebase.deleteContact(id);
    if (this.editDialog) {
      this.editDialog.close();
    }
  }

  /**
   * Tracks if action menu (more options) is open
   * 
   * @type {boolean}
   */
  isMenuOpen = false;

  /**
   * Toggles visibility of action menu (delete option)
   * 
   * Switches menu state to show or hide the delete action button.
   * 
   * @returns {void}
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Closes the action menu
   * 
   * Sets isMenuOpen to false to hide the menu dropdown.
   * 
   * @returns {void}
   */
  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
