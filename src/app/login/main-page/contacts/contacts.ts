import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { SingleContact } from './single-contact/single-contact';
import { FirebaseServices } from '../../../firebase-services/firebase-services';
import { Contact } from '../../../interfaces/contact.interface';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, SingleContact],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Contacts {

  private readonly firebase = inject(FirebaseServices);

  selectedContactId = signal<string | null>(null);
 
  readonly groupedContacts$ = this.firebase.subContactsList().pipe(
    map((contacts: Contact[]) => this.sortAndGroup(contacts))
  );

  onSelectContact(id: string): void {
    this.selectedContactId.set(id);}

  private sortAndGroup(contacts: Contact[]): { letter: string; contacts: Contact[] }[] {
    const groups: Record<string, Contact[]> = {};

    for (const c of contacts) {
      const letter = c.name.trim().charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    }

    return Object.keys(groups)
      .sort()
      .map(letter => ({
        letter,
        contacts: groups[letter]
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
    console.log('Sprint 1 Dummy: Add new contact');
  }
}
