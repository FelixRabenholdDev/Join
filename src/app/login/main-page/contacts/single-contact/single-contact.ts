import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  ViewChild
} from '@angular/core';
import { FirebaseServices } from '../../../../firebase-services/firebase-services';
import { Contact } from '../../../../interfaces/contact.interface';
import { Dialog } from '../../../../shared/dialog/dialog';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-single-contact',
  standalone: true,
  imports: [CommonModule, Dialog, FormsModule],
  templateUrl: './single-contact.html',
  styleUrl: './single-contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleContact {

  contactId = input.required<string>();

  private readonly firebase = inject(FirebaseServices);

  @ViewChild('editDialog') editDialog!: Dialog;

  editModel: Partial<Contact> = {};

  readonly contact$ = computed<Observable<Contact | undefined>>(() =>
    this.firebase.subSingleContact(this.contactId())
  );

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    const first = parts[0]?.charAt(0).toUpperCase() ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return first + last;
  }

  openEdit(contact: Contact): void {
    this.editModel = { ...contact };
    this.editDialog.open();
  }

  async saveEdit(): Promise<void> {
    if (!this.editModel.id) return;
    await this.firebase.editContact(this.editModel as Contact);
    this.editDialog.close();
  }

  async deleteContact(): Promise<void> {
    const id = this.contactId();
    await this.firebase.deleteContact(id);
    this.editDialog.close();
  }
}
