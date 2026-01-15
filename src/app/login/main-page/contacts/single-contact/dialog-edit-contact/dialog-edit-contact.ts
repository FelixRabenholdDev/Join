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

  @ViewChild('editDialog') editDialog!: Dialog;

  editModel: Partial<Contact> = {};

  open() {
    this.editDialog.open();
  }

  async saveEdit(form: NgForm): Promise<void> {
    if (!this.editModel.id || !form.valid) return;
    await this.firebase.editContact(this.editModel as Contact);
    this.editDialog.close();
  }

  async deleteContact(): Promise<void> {
    const id = this.editModel.id;
    if (!id) return;
    this.closeMenu();
    await this.firebase.deleteContact(id);
    if (this.editDialog) {
      this.editDialog.close();
    }
  }

  isMenuOpen = false;
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
