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

  @Output() contactSelected = new EventEmitter<string>();
  @ViewChild('DialogAddNewContact') addDialog!: Dialog;

  editModel: Partial<Contact> = {};
  formModel = signal<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    color: '#000',
  });

  selectedContactId = signal<string | null>(null);

  getInitials(name: string): string {
    return this.userUi.getInitials(name);
  }

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

  writeConfirmation(): void {
    const container = document.querySelector('.confirmation_container') as HTMLElement;
    container.classList.add('confirmation_container--active');
  }
}
