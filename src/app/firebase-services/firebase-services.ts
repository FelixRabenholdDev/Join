import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  collectionData,
  docData,
  getDoc,
  getDocs,
  collectionGroup,
  query,
  where,
  writeBatch,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from '@angular/fire/firestore';
import { Observable, map, switchMap, of } from 'rxjs';
import { Contact } from '../interfaces/contact.interface';
import { Task } from '../interfaces/task.interface';
import { TaskAssign } from '../interfaces/task-assign.interface';
import { Subtask } from '../interfaces/subtask.interface';
import { TaskStatus } from '../types/task-status';
import { TaskAssignDb } from '../interfaces/task-assign-db.interface';
import { Auth, deleteUser, authState } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { UserUiService } from '../services/user-ui.service'

/**
 * Firebase Firestore Database Service
 * 
 * Provides complete CRUD operations and real-time subscriptions for all application data
 * including contacts, tasks, task assignments, and subtasks. Manages all interactions with
 * the Firestore database backend.
 * 
 * Database Structure:
 * - contacts/ - User contact collection
 * - tasks/ - Task collection
 *   - tasks/{taskId}/assigns/ - Task assignments subcollection
 *   - tasks/{taskId}/subtasks/ - Task subtasks subcollection
 * - appSettings/contacts - Application settings document
 * 
 * Key Features:
 * - Real-time subscriptions via Observables
 * - Batch operations for data consistency
 * - Transaction support for complex operations
 * - User contact management
 * - Task lifecycle management (CRUD)
 * - Subtask management
 * - Task assignment tracking
 * - User account deletion with data cleanup
 * 
 * @injectable
 * @providedIn 'root'
 * 
 * @example
 * constructor(private firebase: FirebaseServices) {}
 * 
 * this.firebase.subTasks().subscribe(tasks => {
 *   console.log('Current tasks:', tasks);
 * });
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseServices {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly ui = inject(UserUiService);

  private settingsDoc = doc(this.firestore, 'appSettings/contacts');

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

    const currentUser = this.auth.currentUser;
    const contactRef = doc(this.firestore, `contacts/${contactId}`);
    const contactSnap = await getDoc(contactRef);
    
    if (contactSnap.exists()) {
      const contactData = contactSnap.data();
      const isRegisteredUser = contactData['isUser'] === true;
      const isOwnAccount = currentUser?.uid === contactId;

      if (isRegisteredUser && !isOwnAccount) {
        throw new Error('auth/permission-denied');
      }
    }

    const assignsGroup = collectionGroup(this.firestore, 'assigns');
    const q = query(assignsGroup, where('contactId', '==', contactId));
    const assignsSnap = await getDocs(q);

    if (!assignsSnap.empty) {
      const batch = writeBatch(this.firestore);
      assignsSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }

      await deleteDoc(contactRef);


    if (currentUser?.uid === contactId) {
      await deleteUser(currentUser);
      this.router.navigate(['/Login']);
    }
  }


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

    const taskWithDefaults: Omit<Task, 'id'> = {
      ...task,
      status: task.status ?? TaskStatus.ToDo,
    };

    const docRef = await addDoc(ref, taskWithDefaults);

    return { id: docRef.id, ...taskWithDefaults };
  }

  async editTask(task: Task): Promise<void> {
    if (!task.id) throw new Error('editTask: task.id is missing');
    const ref = doc(this.firestore, `tasks/${task.id}`);
    const { id, ...data } = task;
    await updateDoc(ref, data);
  }

  async deleteTaskWithChildren(taskId: string): Promise<void> {
    if (!taskId) {
      throw new Error('deleteTaskWithChildren: taskId is missing');
    }

    const batch = writeBatch(this.firestore);

    const subtasksRef = collection(this.firestore, `tasks/${taskId}/subtasks`);
    const subtasksSnap = await getDocs(subtasksRef);
    subtasksSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    const assignsRef = collection(this.firestore, `tasks/${taskId}/assigns`);
    const assignsSnap = await getDocs(assignsRef);
    assignsSnap.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    const taskRef = doc(this.firestore, `tasks/${taskId}`);
    batch.delete(taskRef);

    await batch.commit();
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const ref = doc(this.firestore, `tasks/${taskId}`);
    await updateDoc(ref, { status });
  }

  subTaskAssigns(taskId: string): Observable<TaskAssignDb[]> {
    const ref = collection(this.firestore, `tasks/${taskId}/assigns`);
    return collectionData(ref, { idField: 'id' }) as Observable<TaskAssignDb[]>;
  }

  async addTaskAssign(taskId: string, assign: Omit<TaskAssign, 'id'>): Promise<void> {
    const ref = collection(this.firestore, `tasks/${taskId}/assigns`);
    await addDoc(ref, assign);
  }

  async deleteTaskAssign(taskId: string, assignId: string): Promise<void> {
    const ref = doc(this.firestore, `tasks/${taskId}/assigns/${assignId}`);
    await deleteDoc(ref);
  }

  subSubtasks(taskId: string): Observable<Subtask[]> {
    const ref = collection(this.firestore, `tasks/${taskId}/subtasks`);
    return collectionData(ref, { idField: 'id' }) as Observable<Subtask[]>;
  }

  async addSubtask(taskId: string, subtask: Omit<Subtask, 'id'>): Promise<void> {
    const ref = collection(this.firestore, `tasks/${taskId}/subtasks`);
    await addDoc(ref, subtask);
  }

  async editSubtask(
    taskId: string,
    subtaskId: string,
    data: Partial<Omit<Subtask, 'id'>>
  ): Promise<void> {
    const ref = doc(this.firestore, `tasks/${taskId}/subtasks/${subtaskId}`);
    await updateDoc(ref, data);
  }

  async deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
    const ref = doc(this.firestore, `tasks/${taskId}/subtasks/${subtaskId}`);
    await deleteDoc(ref);
  }

  async getLastUserColor(): Promise<number> {
    const snap = await getDoc(this.settingsDoc);
    return snap.exists() ? snap.data()['lastUserColor'] ?? 0 : 0;
  }

  async setLastUserColor(index: number): Promise<void> {
    await updateDoc(this.settingsDoc, { lastUserColor: index });
  }

  async createUserContact(uid: string, contact: Omit<Contact, 'id'>): Promise<void> {
    const ref = doc(this.firestore, `contacts/${uid}`);
    await setDoc(ref, contact);
  }

  public currentUserData$ = authState(this.auth).pipe(
    switchMap(user => {
      if (!user|| user.isAnonymous) return of({ name: 'Guest', initials: 'G' });      

      const userDocRef = doc(this.firestore, `contacts/${user.uid}`);
      return docData(userDocRef).pipe(
        map((data: any) => ({
          name: data?.name || 'User',
          initials: this.ui.getInitials(data?.name)
        }))
      );
    })
  );
  
}
