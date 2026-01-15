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
  @Output() contactSelected = new EventEmitter<string>();
  @ViewChild(DialogAddNewContact) DialogAddNewContact!: Dialog;

  private readonly firebase = inject(FirebaseServices);
  public readonly userUi = inject(UserUiService);

  isDisplayed = true;
  isMediacheck = window.matchMedia('(max-width: 1050px)');

  editModel: Partial<Contact> = {};

  formModel = signal<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    color: '#000',
  });

  selectedContactId = signal<string | null>(null);

  readonly groupedContacts$ = this.firebase
    .subContactsList()
    .pipe(map((contacts: Contact[]) => this.sortAndGroup(contacts)));

  dnoneList(): void {
    if (this.isMediacheck.matches && this.isDisplayed) {
      this.isDisplayed = false;
    } else {
      return;
    }
  }

  onSelectContact(id: string) {
    this.dnoneList();
    this.selectedContactId.set(id);
    this.contactSelected.emit(id);
  }

  returnArrow(): void {
    this.isDisplayed = true;
  }

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

  async onAddContact() {
    const colorIndex = await this.userUi.getNextColorIndex();
    const colorHex = this.userUi.getColorByIndex(colorIndex);

    this.formModel.set({ name: '', email: '', phone: '', color: colorHex });
    this.DialogAddNewContact.open();
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
    this.DialogAddNewContact.close();
    this.writeConfirmation();
  }

  writeConfirmation(): void {
    const container = document.querySelector('.confirmation_container') as HTMLElement;
    container.classList.add('confirmation_container--active');
  }
}
