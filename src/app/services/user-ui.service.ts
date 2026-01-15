import { Injectable, inject, Injector } from '@angular/core';
import { FirebaseServices } from './../firebase-services/firebase-services';
import { Timestamp } from '@angular/fire/firestore';
import { Task } from '../interfaces/task.interface';
import { TaskStatus } from '../types/task-status';

/**
 * Type representing task urgency level
 * 
 * @type {('normal' | 'urgent')}
 */
export type TaskUrgency = 'normal' | 'urgent';

/**
 * User Interface Utilities Service
 * 
 * Provides utility functions for UI rendering including user initials generation,
 * color management, task urgency calculation, and date formatting. Manages user
 * color assignment and tracking across the application.
 * 
 * Color Management:
 * - Cycles through 15 predefined user colors
 * - Persists last used color index in Firestore
 * - Ensures unique colors for consecutive users
 * - Reads colors from CSS custom properties (--userColor1 through --userColor15)
 * 
 * Task Utilities:
 * - Determines task urgency based on priority and status
 * - Calculates remaining days until task due date
 * - Formats dates for display with locale support
 * - Detects urgent and active tasks
 * 
 * @injectable
 * @providedIn 'root'
 * 
 * @example
 * constructor(private ui: UserUiService) {}
 * 
 * const initials = this.ui.getInitials('John Doe'); // 'JD'
 * const urgency = this.ui.getTaskUrgency(task); // 'urgent' | 'normal'
 */
@Injectable({
  providedIn: 'root',
})
export class UserUiService {
  /**
   * Maximum number of available user colors
   * Colors are indexed 1-15 and defined as CSS custom properties
   * 
   * @private
   * @type {number}
   * @default 15
   */
  private readonly maxColors = 15;
  /**
   * Tracks the last color index assigned to a user
   * Persisted in Firestore appSettings/contacts document
   * Used to cycle through colors for new users
   * 
   * @private
   * @type {number}
   */
  private lastUserColor = 0;

  private injector = inject(Injector);

  /**
   * Number of milliseconds in 2 days
   * Used for task urgency calculations
   * 
   * @private
   * @type {number}
   * @constant
   */
  private readonly twoDaysInMS = 2 * 24 * 60 * 60 * 1000;

  /**
   * Initializes the service by loading the last used color index from Firestore
   * Must be called during application startup or user signup
   * 
   * @async
   * @returns {Promise<void>} Resolves when color index is loaded from database
   * 
   * @example
   * await this.ui.init();
   */
  async init(): Promise<void> {
    const firebase = this.injector.get(FirebaseServices);
    this.lastUserColor = await firebase.getLastUserColor();
  }

  /**
   * Extracts and formats user initials from a full name
   * 
   * Returns up to 2 initials: first letter of first name and first letter of last name
   * Falls back to 'G' if name is empty, null, or undefined
   * 
   * @param {string} [name] - User's full name (e.g., 'John Doe')
   * @returns {string} User initials (2 characters maximum, 1 character default)
   * 
   * @example
   * this.ui.getInitials('John Doe'); // 'JD'
   * this.ui.getInitials('Jane'); // 'J'
   * this.ui.getInitials(''); // 'G'
   * this.ui.getInitials(null); // 'G'
   */
  getInitials(name?: string): string {
    if (!name || typeof name !== 'string') {
      return 'G';
    }

    const parts = name.trim().split(' ').filter(Boolean);
    const first = parts[0]?.charAt(0).toUpperCase() ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';

    return first + last || 'G';
  }

  /**
   * Assigns the next color in sequence to a new user
   * 
   * Cycles through colors 1-15, persisting the current index to Firestore.
   * Ensures each user gets a unique color in rotation.
   * 
   * @async
   * @returns {Promise<number>} Color index (1-15) assigned to the user
   * 
   * @example
   * const colorIndex = await this.ui.getNextColorIndex(); // 1
   * const color = this.ui.getColorByIndex(colorIndex); // '#FF5733'
   */
  async getNextColorIndex(): Promise<number> {
    const firebase = this.injector.get(FirebaseServices);
    this.lastUserColor = (this.lastUserColor % this.maxColors) + 1;
    await firebase.setLastUserColor(this.lastUserColor);
    return this.lastUserColor;
  }

  /**
   * Retrieves the hex color value for a given color index
   * 
   * Reads CSS custom properties from document root (--userColor1 through --userColor15)
   * which are defined in the global stylesheets.
   * 
   * @param {number} index - Color index (1-15)
   * @returns {string} Hex color value (e.g., '#FF5733'), defaults to '#000000' if not found
   * 
   * @example
   * const color = this.ui.getColorByIndex(1); // '#FF5733'
   * const color = this.ui.getColorByIndex(5); // '#3498DB'
   */
  getColorByIndex(index: number): string {
    const cssVar = `--userColor${index}`;
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue(cssVar).trim() || '#000000';
  }

  /**
   * Determines if a task is both urgent and in an active status
   * 
   * A task is considered urgent-and-active if:
   * - Priority is 1 (highest urgency)
   * - Status is one of: ToDo, InProgress, AwaitFeedback (not Done)
   * 
   * @param {Task} [task] - Task object to evaluate
   * @returns {boolean} True if task is urgent and in active status, false otherwise
   * 
   * @example
   * const isUrgent = this.ui.isUrgentAndActive(task); // true|false
   */
  isUrgentAndActive(task?: Task): boolean {
  return (
    task?.priority === 1 &&
    [
      TaskStatus.ToDo,
      TaskStatus.InProgress,
      TaskStatus.AwaitFeedback,
    ].includes(task.status)
  );
}

  /**
   * Determines the urgency level of a task
   * 
   * Returns 'urgent' if task priority is 1, otherwise returns 'normal'
   * 
   * @param {Task} [task] - Task object to evaluate
   * @returns {TaskUrgency} Urgency level: 'urgent' or 'normal'
   * 
   * @example
   * this.ui.getTaskUrgency(task); // 'urgent' | 'normal'
   */
  getTaskUrgency(task?: Task): TaskUrgency {
    return task?.priority === 1 ? 'urgent' : 'normal';
  }

  /**
   * Calculates the number of days remaining until a task's due date
   * 
   * Returns the ceiling of the difference between due date and current time
   * in days. Positive values indicate days until due, negative values indicate
   * days past due.
   * 
   * @param {Timestamp} [dueDate] - Firestore Timestamp of task due date
   * @returns {number | null} Days until/past due date, or null if no due date
   * 
   * @example
   * this.ui.getRemainingDays(task.dueDate); // 5 (due in 5 days)
   * this.ui.getRemainingDays(task.dueDate); // -2 (2 days overdue)
   * this.ui.getRemainingDays(null); // null
   */
  getRemainingDays(dueDate?: Timestamp): number | null {
    if (!dueDate) return null;

    const now = Date.now();
    const dueTime = dueDate.toDate().getTime();

    return Math.ceil((dueTime - now) / (24 * 60 * 60 * 1000));
  }

  /**
   * Formats a Firestore Timestamp for display as a localized date string
   * 
   * Converts Firestore Timestamp to local date format with day, month, and year
   * Default locale is German (de-DE), but can be customized per call
   * 
   * @param {Timestamp} [dueDate] - Firestore Timestamp to format
   * @param {string} [locale='de-DE'] - BCP 47 locale string (e.g., 'en-US', 'fr-FR')
   * @returns {string} Formatted date string (e.g., '15. Januar 2024'), empty string if no date
   * 
   * @example
   * this.ui.formatTaskDate(task.dueDate); // '15. Januar 2024' (German)
   * this.ui.formatTaskDate(task.dueDate, 'en-US'); // 'January 15, 2024'
   */
  formatTaskDate(dueDate?: Timestamp, locale: string = 'de-DE'): string {
    if (!dueDate) return '';

    return dueDate.toDate().toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
