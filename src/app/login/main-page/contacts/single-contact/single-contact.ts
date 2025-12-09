import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, computed, inject, input } from '@angular/core';
import { FirebaseServices } from '../../../../firebase-services/firebase-services';
import { Contact } from '../../../../interfaces/contact.interface';
import { Dialog } from '../../../../shared/dialog/dialog';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-single-contact',
  standalone: true,
  imports: [CommonModule, Dialog],
  templateUrl: './single-contact.html',
  styleUrl: './single-contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SingleContact {

  contactId = input.required<string>();

  private readonly firebase = inject(FirebaseServices);

  readonly contact$ = computed<Observable<Contact | undefined>>(() =>
    this.firebase.subSingleContact("BR8kjYcp6f5fCLvM5f2b") // PLACEHOLDER!!!!!!!!!!!!!!!!!!!!!!!!!
  );

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ');
    const first = parts[0]?.charAt(0).toUpperCase() ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return first + last;
  }
}
