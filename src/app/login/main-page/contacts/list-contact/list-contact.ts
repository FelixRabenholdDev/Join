import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal, viewChild, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { FirebaseServices } from '../../../../firebase-services/firebase-services';
import { Contact } from '../../../../interfaces/contact.interface';
import { map } from 'rxjs/operators';
import { Dialog } from '../../../../shared/dialog/dialog';
import { DialogAddNewContact } from './dialog-add-new-contact/dialog-add-new-contact';

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


  isDisplayed = true;
  isMediacheck = window.matchMedia('(max-width: 1050px)');

  editModel: Partial<Contact> = {};

  formModel = signal<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    color: this.getColor(),
  });


  selectedContactId = signal<string | null>(null);

  private lastUserColor = 7;
  private maxColors = 15;

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

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    const first = parts[0]?.charAt(0).toUpperCase() ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return first + last;
  }

      private getColor(): string {
    this.lastUserColor = (this.lastUserColor % this.maxColors) + 1;

    const cssVar = `--userColor${this.lastUserColor}`;
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue(cssVar).trim();

    return color;
  }

  onAddContact(): void {
    this.formModel.set({
      name: '',
      email: '',
      phone: '',
      color: this.getColor(),
    });
    this.DialogAddNewContact.open();

  }

  async saveNewContact(form: NgForm): Promise<void> {
    if (!form.valid) return;
    const data = this.formModel();
    await this.firebase.setLastUserColor(this.lastUserColor);

    await this.firebase.addContact({
      name: data.name?.trim() ?? '',
      email: data.email?.trim() ?? '',
      phone: data.phone?.trim() ?? '',
      color: data.color ?? '#000'
    });
    this.DialogAddNewContact.close();
    this.writeConfirmation();
  }

  writeConfirmation(): void {
    const container = document.querySelector('.confirmation_container') as HTMLElement;
    container.classList.add('confirmation_container--active');
  }
}