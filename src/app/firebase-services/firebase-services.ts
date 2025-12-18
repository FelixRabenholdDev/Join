import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  collectionData,
  docData,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Contact } from '../interfaces/contact.interface';
import { Task } from '../interfaces/task.interface';
import { TaskType } from '../types/task-type';

@Injectable({
  providedIn: 'root',
})
export class FirebaseServices {
  private readonly firestore = inject(Firestore);

  private settingsDoc = doc(this.firestore, 'appSettings/contacts');

  /* ================================CONTACTS================================= */

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
      color: data.color ?? '',
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

  /* ================================TASKS================================= */

  subTasks(): Observable<Task[]> {
    const ref = collection(this.firestore, 'tasks');
    return collectionData(ref, { idField: 'id' }) as Observable<Task[]>;
  }

  subSingleTask(taskId: string): Observable<Task | undefined> {
    const ref = doc(this.firestore, `tasks/${taskId}`);
    return docData(ref, { idField: 'id' }) as Observable<Task | undefined>;
  }

  async addTask(task: Omit<Task, 'id'>): Promise<Task> {
    const ref = collection(this.firestore, 'tasks');
    const docRef = await addDoc(ref, {
      ...task,
      type: task.type as TaskType,
    });

    return { id: docRef.id, ...task };
  }

  async editTask(task: Task): Promise<void> {
    if (!task.id) throw new Error('editTask: task.id is missing');

    const { id, ...data } = task;
    const ref = doc(this.firestore, `tasks/${id}`);
    await updateDoc(ref, data);
  }

  async deleteTask(taskId: string): Promise<void> {
    const ref = doc(this.firestore, `tasks/${taskId}`);
    await deleteDoc(ref);
  }

  /* ========================== TASK SUBCOLLECTIONS ========================== */

  subTaskAssigns(taskId: string): Observable<any[]> {
    const ref = collection(this.firestore, `tasks/${taskId}/assigns`);
    return collectionData(ref, { idField: 'id' });
  }

  async addTaskAssign(taskId: string, assign: any): Promise<void> {
    const ref = collection(this.firestore, `tasks/${taskId}/assigns`);
    await addDoc(ref, assign);
  }

  async deleteTaskAssign(taskId: string, assignId: string): Promise<void> {
    const ref = doc(this.firestore, `tasks/${taskId}/assigns/${assignId}`);
    await deleteDoc(ref);
  }

  subSubtasks(taskId: string): Observable<any[]> {
    const ref = collection(this.firestore, `tasks/${taskId}/subtasks`);
    return collectionData(ref, { idField: 'id' });
  }

  async addSubtask(taskId: string, subtask: any): Promise<void> {
    const ref = collection(this.firestore, `tasks/${taskId}/subtasks`);
    await addDoc(ref, subtask);
  }

  async editSubtask(taskId: string, subtaskId: string, data: any): Promise<void> {
    const ref = doc(this.firestore, `tasks/${taskId}/subtasks/${subtaskId}`);
    await updateDoc(ref, data);
  }

  async deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
    const ref = doc(this.firestore, `tasks/${taskId}/subtasks/${subtaskId}`);
    await deleteDoc(ref);
  }

  /* ================================ SETTINGS =============================== */

  async getLastUserColor(): Promise<number> {
    const snap = await getDoc(this.settingsDoc);
    return snap.exists() ? snap.data()['lastUserColor'] ?? 0 : 0;
  }

  async setLastUserColor(index: number): Promise<void> {
    await updateDoc(this.settingsDoc, { lastUserColor: index });
  }
}
