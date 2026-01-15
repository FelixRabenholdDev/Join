import { Component, inject, signal, OnInit } from '@angular/core';
import { FirebaseServices } from '../../../firebase-services/firebase-services';
import { TaskStatus } from '../../../types/task-status';
import { map } from 'rxjs/operators';
import { AsyncPipe, NgIf } from '@angular/common';
import { UserUiService } from '../../../services/user-ui.service';
import { Task } from '../../../interfaces/task.interface';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { AuthService } from '../../../firebase-services/auth-services';

/**
 * Summary/Dashboard Component
 * 
 * Displays an overview of tasks, assignments, and urgent items. Provides
 * a high-level view of project status with task statistics and next upcoming deadline.
 * 
 * Features:
 * - Task statistics (To Do, In Progress, Awaiting Feedback, Done counts)
 * - Urgent task count
 * - Total tasks count
 * - Next due task date display
 * - User greeting with time-based message
 * - Animated summary panel with overlay
 * - Real-time updates from Firestore
 * - Current user data display
 * 
 * UI Elements:
 * - Animated background overlay (shows on load, fades out)
 * - Summary cards showing task counts by status
 * - Urgent tasks indicator
 * - Next deadline display
 * - User greeting with current username
 * - Dynamic greeting based on time of day
 * 
 * @component
 * @selector app-summary
 * @standalone true
 * @implements {OnInit}
 */
@Component({
  selector: 'app-summary',
  imports: [AsyncPipe, NgIf],
  templateUrl: './summary.html',
  styleUrls: ['./summary.scss', './summary-media.scss'],
  animations: []
  
})
export class Summary implements OnInit {
  private firebase = inject(FirebaseServices);
  private router = inject(Router);
  private auth = inject(AuthService);
  ui = inject(UserUiService);

  /**
   * Greeting message based on current time of day
   * "Good morning", "Good afternoon", or "Good evening"
   * 
   * @type {string}
   */
  greeting = this.getGreeting();

  /**
   * Observable stream of current user data from Firestore
   * Contains authenticated user information
   * 
   * @type {Observable<User | undefined>}
   */
  userData$ = this.firebase.currentUserData$;

  /**
   * Signal controlling visibility of overlay element
   * True when overlay should be displayed, false when hidden
   * Automatically hidden after 1 second on login
   * 
   * @type {Signal<boolean>}
   */
  overlay = signal(true);

  /**
   * Signal controlling summary panel visibility
   * True when summary panel should be shown
   * 
   * @type {Signal<boolean>}
   */
   showSummary = signal(false);

   /**
    * Signal controlling if overlay DOM element is mounted
    * True when overlay should exist in DOM, false when removed
    * Separate from visibility for performance optimization
    * 
    * @type {Signal<boolean>}
    */
   overlayInDom = signal(false);

  /**
   * Observable stream of task summary statistics
   * 
   * Aggregates task counts by status, calculates urgent task count,
   * computes total tasks, and finds the next due date.
   * Returns empty summary object if no tasks exist.
   * 
   * @type {Observable<{
   *   todo: number,
   *   inProgress: number,
   *   awaitFeedback: number,
   *   done: number,
   *   urgent: number,
   *   total: number,
   *   nextDueDate: Timestamp | null
   * }>}
   */
  summary$ = this.firebase.subTasks().pipe(
    map((tasks) => {
      if (!tasks) return this.getEmptySummary();
      const upcoming = this.getNextDueTask(tasks);

      return {
        todo: tasks.filter((t) => t.status === TaskStatus.ToDo).length,
        inProgress: tasks.filter((t) => t.status === TaskStatus.InProgress).length,
        awaitFeedback: tasks.filter((t) => t.status === TaskStatus.AwaitFeedback).length,
        done: tasks.filter((t) => t.status === TaskStatus.Done).length,
        urgent: tasks.filter((t) => this.ui.isUrgentAndActive(t)).length,
        total: tasks.length,
        nextDueDate: upcoming ? upcoming.date : null,
      };
    }),
  );

/**
 * Angular OnInit lifecycle hook
 * 
 * Initializes the overlay animation on component load. If user just logged in
 * and viewport is mobile (max-width: 1050px), shows overlay for 1 second then
 * fades it out. Removes overlay from DOM after 100 seconds. Resets the login
 * flag after 2 seconds.
 * 
 * Subscribes to auth service's justLoggedIn$ Observable to detect new logins
 * and trigger the overlay animation for mobile users.
 * 
 * @returns {void}
 */
ngOnInit(): void {
  this.overlay.set(false);

  this.auth.justLoggedIn$.subscribe((justLoggedIn) => {
    if (justLoggedIn && window.innerWidth <= 1050) {
      this.overlayInDom.set(true); 
      this.overlay.set(true);      

      timer(1000).subscribe(() => {
        this.overlay.set(false); 
      });

      timer(100000).subscribe(() => {
        this.overlayInDom.set(false);
      });

      timer(2000).subscribe(() => {
        this.auth['justLoggedInSubject'].next(false);
      });
    }
  });
}

/**
 * Navigates to the board/kanban view
 * 
 * Routes the user from summary dashboard to the task management board
 * where they can view, create, and manage tasks in a kanban layout.
 * 
 * @returns {void}
 * 
 * @example
 * // Navigate to board when user clicks "Go to Board" button
 * this.toBoard();
 * // Router navigates to /board route
 */
toBoard() {
  this.router.navigate(['/board']);
}

/**
 * Returns an empty summary object with all zero counts
 * 
 * Used as fallback when no tasks are available from Firestore.
 * Provides default structure for template binding.
 * 
 * @private
 * @returns {{
 *   todo: 0,
 *   inProgress: 0,
 *   awaitFeedback: 0,
 *   done: 0,
 *   urgent: 0,
 *   total: 0,
 *   nextDueDate: null
 * }} Empty summary object with all counts set to zero
 */
private getEmptySummary() {
  return {
    todo: 0,
    inProgress: 0,
    awaitFeedback: 0,
    done: 0,
    urgent: 0,
    total: 0,
    nextDueDate: null,
  };
}

/**
 * Generates a time-based greeting message
 * 
 * Returns different greeting based on current time of day:
 * - Before 12:00 PM: "Good morning,"
 * - Before 6:00 PM: "Good afternoon,"
 * - After 6:00 PM: "Good evening,"
 * 
 * @private
 * @returns {string} Greeting message based on current hour
 * 
 * @example
 * // Returns different greetings throughout the day
 * this.getGreeting(); // "Good morning," at 10 AM
 * this.getGreeting(); // "Good afternoon," at 3 PM
 * this.getGreeting(); // "Good evening," at 8 PM
 */
private getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

/**
 * Finds the task with the earliest due date
 * 
 * Filters tasks to only include those with valid date properties,
 * then sorts by date and returns the earliest one (next due).
 * Handles edge cases where tasks may lack dates or have invalid timestamps.
 * 
 * @private
 * @param {Task[]} tasks - Array of tasks to search
 * 
 * @returns {Task | null} Task with earliest due date, or null if no valid tasks found
 * 
 * @throws {Error} Will throw if task.date.toMillis() is not a valid function
 * 
 * @example
 * // Find next due task to display deadline
 * const nextTask = this.getNextDueTask(taskArray);
 * // Returns task with soonest deadline, or null if no dates set
 */
private getNextDueTask(tasks: Task[]): Task | null {
  if (!tasks || tasks.length === 0) return null;
  const tasksWithDate = tasks.filter((t) => t.date && typeof t.date.toMillis === 'function');

  if (tasksWithDate.length === 0) return null;

  return tasksWithDate.sort((a, b) => a.date.toMillis() - b.date.toMillis())[0];
}
}
