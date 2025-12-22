import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
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
@Component({
  selector: 'app-dialog-add-new-contact',
  imports: [CommonModule, FormsModule, Dialog],
  templateUrl: './dialog-add-new-contact.html',
  styleUrl: './dialog-add-new-contact.scss',
  standalone: true,
})

export class DialogAddNewContact {
  private readonly firebase = inject(FirebaseServices);

  @Output() contactSelected = new EventEmitter<string>();
  @ViewChild('DialogAddNewContact') addDialog!: Dialog;

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

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    const first = parts[0]?.charAt(0).toUpperCase() ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return first + last;
  }

  open() {
    this.addDialog.open();
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
    this.addDialog.close();
    this.writeConfirmation();
  }

  private getColor(): string {
    this.lastUserColor = (this.lastUserColor % this.maxColors) + 1;

    const cssVar = `--userColor${this.lastUserColor}`;
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue(cssVar).trim();

    return color;
  }

  writeConfirmation(): void {
    const container = document.querySelector('.confirmation_container') as HTMLElement;
    container.classList.add('confirmation_container--active');
  }
}
