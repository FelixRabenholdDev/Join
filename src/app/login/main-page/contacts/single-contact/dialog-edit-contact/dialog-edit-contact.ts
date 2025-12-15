import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  ViewChild,
} from '@angular/core';
import { FirebaseServices } from '../../../../../firebase-services/firebase-services';
import { Contact } from '../../../../../interfaces/contact.interface';
import { FormsModule } from '@angular/forms';
import { Dialog } from '../../../../../shared/dialog/dialog';
@Component({
  selector: 'app-dialog-edit-contact',
  imports: [CommonModule, FormsModule, Dialog],
  templateUrl: './dialog-edit-contact.html',
  styleUrl: './dialog-edit-contact.scss',
  standalone: true,
})
export class DialogEditContact {
  private readonly firebase = inject(FirebaseServices);

  @ViewChild('editDialog') editDialog!: Dialog;

  editModel: Partial<Contact> = {};

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    const first = parts[0]?.charAt(0).toUpperCase() ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return first + last;
  }

  open() {
    this.editDialog.open();
  }

  async saveEdit(): Promise<void> {
    if (!this.editModel.id) return;
    // this.closeMenu(); // Falls das Menü im Dialog auch geschlossen werden soll
    await this.firebase.editContact(this.editModel as Contact);
    this.editDialog.close();
  }

  async deleteContact(): Promise<void> {
    const id = this.editModel.id;
    if (!id) return;
    this.closeMenu();
    await this.firebase.deleteContact(id);
    if (this.editDialog) {
      this.editDialog.close();
    }
  }

  isMenuOpen = false;
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
