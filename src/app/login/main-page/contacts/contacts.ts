import { CommonModule } from '@angular/common';
import { SingleContact } from './single-contact/single-contact';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FirebaseServices } from '../../../firebase-services/firebase-services';
import { Contact } from '../../../interfaces/contact.interface';
import { Navbar } from "../../../shared/navbar/navbar";

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, SingleContact, Navbar],  
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss'
})

export class Contacts implements OnInit {

  groupedContacts: { letter: string; contacts: Contact[] }[] = [];

  constructor(
    private firebase: FirebaseServices,
    private cd: ChangeDetectorRef           // für die korrekte Aktualisierung der Kontaktliste
  ) {}

  ngOnInit(): void {
    this.initRealtimeSync();
  }

  /**
   * Aktiviert den Firestore-Realtime-Listener und sorgt dafür,
   * dass Änderungen automatisch sichtbar werden ...
   */
  initRealtimeSync(): void {
    // Startet Firestore-Listener (bereits im Service implementiert)
    this.firebase.subContactsList();

    // Polling zur kontinuierlichen Aktualisierung im UI
    var self = this;
    setInterval(function () {
      self.sortAndGroup();
      self.cd.detectChanges();   // WICHTIG: Aktualisiert die Angular-Ansicht
    }, 200);
  }

  /**
   * Sortiert die Kontakte alphabetisch und gruppiert sie (A, B, D ...)
   */
  sortAndGroup(): void {
    var list = this.firebase.contactsList;
    var groups: { [key: string]: Contact[] } = {};
    var i: number;

    for (i = 0; i < list.length; i++) {
      var c = list[i];
      var letter = c.name.trim().charAt(0).toUpperCase();

      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(c);
    }

    var letters = Object.keys(groups).sort();
    var result: { letter: string; contacts: Contact[] }[] = [];

    for (i = 0; i < letters.length; i++) {
      var l = letters[i];
      result.push({
        letter: l,
        contacts: groups[l]
      });
    }

    this.groupedContacts = result;
  }

  /**
   * Erstellt Initialen aus einem Namen (z. B. "Anton Mayer" = "AM")
   */
  getInitials(name: string): string {
    var parts = name.trim().split(' ');
    var first = parts[0].charAt(0).toUpperCase();
    var second = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return first + second;
  }

  /**
   * Dummy-Funktion für Sprint 1
   */
  onAddContact(): void {
    console.log('Sprint 1 Dummy: Add new contact');
  }
}
