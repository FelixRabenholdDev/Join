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
  contactId = input.required<string>();
  private readonly firebase = inject(FirebaseServices);
  public readonly userUi = inject(UserUiService);
  private readonly router = inject(Router);

  @ViewChild(DialogEditContact) dialogEditContact!: DialogEditContact;

  readonly contact$ = computed(() =>
    this.firebase.subSingleContact(this.contactId())
  );

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

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

  openEdit(contact: Contact): void {
    this.closeMenu();
    this.dialogEditContact.editModel = { ...contact };
    this.dialogEditContact.open();
  }
}
