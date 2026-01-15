import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, signal, ViewChild } from '@angular/core';
import { SingleContact } from './single-contact/single-contact';
import { ListContact } from './list-contact/list-contact';

/**
 * Contacts Management Component
 * 
 * Provides a two-panel interface for managing application contacts.
 * Left panel displays list of all contacts, right panel shows detailed
 * view and editing capabilities for selected contact.
 * 
 * Features:
 * - Contact list with selection
 * - Detailed contact view/edit panel
 * - Responsive layout (responsive design adapts for mobile)
 * - Add/edit/delete contact operations via SingleContact component
 * - Contact navigation with back button
 * 
 * State Management:
 * - Uses Angular signals for reactive state (selectedContactId)
 * - Communicates with child components via methods
 * 
 * @component
 * @selector app-contacts
 * @standalone true
 * @changeDetection OnPush (optimized change detection)
 */
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, ListContact, SingleContact],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contacts {
  @ViewChild(ListContact) listContact!: ListContact;

  selectedContactId = signal<string | null>(null);

  setSelectedContact(id: string) {
    this.selectedContactId.set(id);
  }

  returnArrow(): void {
    this.selectedContactId.set(null);
    if (this.listContact) {
      this.listContact.returnArrow();
    }
  }
}
