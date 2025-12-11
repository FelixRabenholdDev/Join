import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal, ViewChild } from '@angular/core';
import { SingleContact } from './single-contact/single-contact';
import { FirebaseServices } from '../../../firebase-services/firebase-services';
import { Contact } from '../../../interfaces/contact.interface';
import { map } from 'rxjs/operators';
import { Dialog } from '../../../shared/dialog/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, SingleContact, Dialog, FormsModule],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contacts {
  private readonly firebase = inject(FirebaseServices);

  @ViewChild('addDialog') addDialog!: Dialog;

  editModel: Partial<Contact> = {};

  formModel = signal<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    color: this.getColor()
  });

  selectedContactId = signal<string | null>(null);

  readonly groupedContacts$ = this.firebase
    .subContactsList()
    .pipe(map((contacts: Contact[]) => this.sortAndGroup(contacts)));

  onSelectContact(id: string) {
    this.selectedContactId.set(id);
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

  /**
   * Dummy (Sprint 1)
   */
    onAddContact(): void {
    this.formModel.set({
      name: '',
      email: '',
      phone: '',
      color: this.getColor()
    });
    this.addDialog.open();
  }

  async saveNewContact(): Promise<void> {
    const data = this.formModel();

    if (!data.name?.trim()) return;

    await this.firebase.addContact({
      name: data.name.trim(),
      email: data.email?.trim() ?? '',
      phone: data.phone?.trim() ?? '',
      color: data.color ?? '#000'
    });

    this.addDialog.close();
  }

  private getColor(): string {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }
}

