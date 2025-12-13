import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal, viewChild, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseServices } from '../../../../firebase-services/firebase-services';
import { Contact } from '../../../../interfaces/contact.interface';
import { map } from 'rxjs/operators';
import { Dialog } from '../../../../shared/dialog/dialog';

@Component({
  selector: 'app-list-contact',
  imports: [CommonModule, FormsModule, Dialog],
  templateUrl: './list-contact.html',
  styleUrl: './list-contact.scss',
})
export class ListContact {

  @Output() contactSelected = new EventEmitter<string>();
  @ViewChild('addDialog') addDialog!: Dialog;

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

  constructor() {
    this.loadLastUserColor();
  }

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

  onAddContact(): void {
    this.formModel.set({
      name: '',
      email: '',
      phone: '',
      color: this.getColor(),
    });
    this.addDialog.open();
  }

  async saveNewContact(): Promise<void> {
    const data = this.formModel();
    if (!data.name?.trim()) return;
    await this.firebase.setLastUserColor(this.lastUserColor);

    await this.firebase.addContact({
      name: data.name.trim(),
      email: data.email?.trim() ?? '',
      phone: data.phone?.trim() ?? '',
      color: data.color ?? '#000'
    });
    this.addDialog.close();
  }

  private getColor(): string {
    this.lastUserColor = (this.lastUserColor % this.maxColors) + 1;

    const cssVar = `--userColor${this.lastUserColor}`;
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue(cssVar).trim();

    return color;
  }

  private async loadLastUserColor() {
    this.lastUserColor = await this.firebase.getLastUserColor();
  }

}
