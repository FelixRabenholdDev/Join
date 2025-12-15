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

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    const first = parts[0]?.charAt(0).toUpperCase() ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return first + last;
  }

  async deleteContact(): Promise<void> {
    const id = this.contactId();
    this.closeMenu();
    await this.firebase.deleteContact(id);
  }

  openEdit(contact: Contact): void {
    this.closeMenu();
    this.dialogEditContact.editModel = { ...contact };
    this.dialogEditContact.open();
  }
}
