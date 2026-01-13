import { Injectable, inject, Injector } from '@angular/core';
import { FirebaseServices } from './../firebase-services/firebase-services';
import { Timestamp } from '@angular/fire/firestore';
import { Task } from '../interfaces/task.interface';

export type TaskUrgency = 'normal' | 'urgent';

@Injectable({
  providedIn: 'root',
})
export class UserUiService {
  private readonly maxColors = 15;
  private lastUserColor = 0;

  private injector = inject(Injector);

  private readonly twoDaysInMS = 2 * 24 * 60 * 60 * 1000;

  async init(): Promise<void> {
    const firebase = this.injector.get(FirebaseServices);
    this.lastUserColor = await firebase.getLastUserColor();
  }

  getInitials(name?: string): string {
    if (!name || typeof name !== 'string') {
      return 'G';
    }

    const parts = name.trim().split(' ').filter(Boolean);
    const first = parts[0]?.charAt(0).toUpperCase() ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';

    return first + last || 'G';
  }

  async getNextColorIndex(): Promise<number> {
    const firebase = this.injector.get(FirebaseServices);
    this.lastUserColor = (this.lastUserColor % this.maxColors) + 1;
    await firebase.setLastUserColor(this.lastUserColor);
    return this.lastUserColor;
  }

  getColorByIndex(index: number): string {
    const cssVar = `--userColor${index}`;
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue(cssVar).trim() || '#000000';
  }

  isTaskUrgent(task?: Task): boolean {
    return task?.priority === 1;
  }

  getTaskUrgency(task?: Task): TaskUrgency {
    return task?.priority === 1 ? 'urgent' : 'normal';
  }

  getRemainingDays(dueDate?: Timestamp): number | null {
    if (!dueDate) return null;

    const now = Date.now();
    const dueTime = dueDate.toDate().getTime();

    return Math.ceil((dueTime - now) / (24 * 60 * 60 * 1000));
  }

  formatTaskDate(dueDate?: Timestamp, locale: string = 'de-DE'): string {
    if (!dueDate) return '';

    return dueDate.toDate().toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
