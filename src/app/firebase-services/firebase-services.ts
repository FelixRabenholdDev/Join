import { Component, inject } from '@angular/core';
import { Firestore, collection, doc } from '@angular/fire/firestore';

@Component({
  selector: 'app-firebase-services',
  imports: [],
  templateUrl: './firebase-services.html',
  styleUrl: './firebase-services.scss',
})
export class FirebaseServices {
  firestore = inject(Firestore);

  constructor() {}

  getContactsRef() {
    return collection(this.firestore, 'contacts');
  }

  getSingleContact(docID:string) {
    return doc(collection(this.firestore, 'contacts'), docID);
  }
}
