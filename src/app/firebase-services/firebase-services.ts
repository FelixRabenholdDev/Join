import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  collectionData,
  docData,
  addDoc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Contact } from '../interfaces/contact.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseServices {

  private readonly firestore = inject(Firestore);

  subContactsList(): Observable<Contact[]> {
    const ref = collection(this.firestore, 'contacts');
    return collectionData(ref, { idField: 'id' }) as Observable<Contact[]>;
  }

  subSingleContact(docID: string): Observable<Contact | undefined> {
    const ref = doc(this.firestore, `contacts/${docID}`);
    return docData(ref, { idField: 'id' }) as Observable<Contact | undefined>;
  }

  toContact(data: any): Contact {
    return {
      id: data.id,
      name: data.name ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      color: data.color ?? ''
    };
  }

  async addContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
    const ref = collection(this.firestore, 'contacts');
    const docRef = await addDoc(ref, contact);
    return { id: docRef.id, ...contact };
  }

  async editContact(contact: Contact): Promise<void> {
    if (!contact.id) {
      throw new Error('editContact: contact.id is missing');
    }

    const ref = doc(this.firestore, `contacts/${contact.id}`);
    const { id, ...data } = contact;
    await updateDoc(ref, data);
  }

  async deleteContact(contactId: string): Promise<void> {
    if (!contactId) {
      throw new Error('deleteContact: contactId is missing');
    }

    const ref = doc(this.firestore, `contacts/${contactId}`);
    await deleteDoc(ref);
  }
}
