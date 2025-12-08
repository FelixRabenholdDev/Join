import { Component, Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, onSnapshot } from '@angular/fire/firestore';
import { Contact } from '../interfaces/contact.interface';

@Injectable({
  providedIn: 'root',
})
export class FirebaseServices {
  contactsList: Contact[] = [];

  unsubList;

  firestore = inject(Firestore);

  constructor() {
    this.unsubList = this.subContactsList();
  }

  ngOnDestroy() {
    this.unsubList();
  }

  subContactsList() {
    return onSnapshot(this.getContactsRef(), (list) => {
      this.contactsList = [];
      list.forEach((element) => {
        this.contactsList.push(this.setContactObject(element.data(), element.id));
      });
    });
  }

  subSingleContact(docID: string) {
    return onSnapshot(this.getSingleContact(docID), (contact) => {
      contact.data();
    });
  }

  setContactObject(obj: any, id: string): Contact {
    return {
      id: id,
      name: obj.name || '',
      email: obj.email || '',
      phone: obj.phone || '',
      color: obj.color || '',
    };
  }

  getContactsRef() {
    return collection(this.firestore, 'contacts');
  }

  getSingleContact(docID: string) {
    return doc(collection(this.firestore, 'contacts'), docID);
  }
}
