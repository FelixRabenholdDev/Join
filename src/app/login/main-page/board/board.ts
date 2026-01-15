import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogAddTask } from './dialog-add-task/dialog-add-task';
import { DialogShowEditTask } from './task-preview/dialog-show-edit-task/dialog-show-edit-task';
import { FirebaseServices } from '../../../firebase-services/firebase-services';
import { Task } from '../../../interfaces/task.interface';
import { BoardTask } from '../../../interfaces/task-board.interface';
import { TaskAssign } from '../../../interfaces/task-assign.interface';
import { TaskAssignDb } from '../../../interfaces/task-assign-db.interface';
import { TaskStatus } from '../../../types/task-status';
import { Observable, combineLatest, map, switchMap, of } from 'rxjs';
import { UserUiService } from '../../../services/user-ui.service';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskPreview } from './task-preview/task-preview';
import { FormsModule } from '@angular/forms';
import { FilterTaskPipe } from '../../../shared/pipes/filter-Task-pipe';
import { Auth, authState } from '@angular/fire/auth';
import { AuthService } from '../../../firebase-services/auth-services';
import { Router } from '@angular/router';

/**
 * Task Board Component - Kanban-Style Task Management
 * 
 * Displays tasks in a kanban board format with four columns representing
 * task statuses (Todo, InProgress, AwaitFeedback, Done). Users can drag-and-drop
 * tasks between columns to update status, add new tasks, and edit existing ones.
 * 
 * Features:
 * - Drag-and-drop task management across status columns
 * - Real-time task list updates via Firestore subscriptions
 * - Task filtering by title/description search
 * - Mobile-friendly (touch-enabled drag delay)
 * - Add new task dialog
 * - Edit existing task dialog with full task details
 * - Task preview cards with priority, urgency, and assignment info
 * - Responsive layout for desktop and mobile
 * 
 * Task Status Columns:
 * - Todo: New/unstarted tasks
 * - InProgress: Currently being worked on
 * - AwaitFeedback: Completed, awaiting review
 * - Done: Completed tasks
 * 
 * @component
 * @selector app-board
 * @standalone true
 */
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    DialogAddTask,
    DialogShowEditTask,
    CommonModule,
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    TaskPreview,
    FormsModule,
    FilterTaskPipe,
  ],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  private readonly firebase = inject(FirebaseServices);
  private readonly userUi = inject(UserUiService);
    private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  /**
   * Enum reference for task status values used in template
   * Allows template to access TaskStatus.ToDo, TaskStatus.InProgress, etc.
   * 
   * @type {typeof TaskStatus}
   */
  TaskStatus = TaskStatus;

  /**
   * Search/filter input value for tasks
   * Bound to filter input in template, controls which tasks are displayed
   * 
   * @type {string}
   */
  searchInput: string = '';

  /**
   * Detects if the device is a mobile/touch device
   * Checks for touch event support or maximum touch points
   * 
   * @type {boolean}
   */
  isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  /**
   * Drag-and-drop delay in milliseconds
   * 400ms for mobile (prevents accidental drags), 0ms for desktop
   * 
   * @type {number}
   */
  dragDelay = this.isMobile ? 400 : 0;

  /**
   * Reference to the DialogAddTask component
   * Controlled to open/close for creating new tasks
   * 
   * @type {DialogAddTask}
   */
  @ViewChild(DialogAddTask) dialogAddTask!: DialogAddTask;

  /**
   * Reference to the DialogShowEditTask component
   * Controlled to open/close for editing existing tasks
   * 
   * @type {DialogShowEditTask}
   */
  @ViewChild(DialogShowEditTask) dialogShowEditTask!: DialogShowEditTask;

  /**
   * Opens the add task dialog or navigates to add-task page on mobile
   * 
   * Opens the DialogAddTask modal with the specified task status.
   * On mobile devices (max-width: 980px), navigates to dedicated /add-task page
   * with status as query parameter for better UX. On desktop, shows modal inline.
   * 
   * @param {TaskStatus} status - Initial status for the new task (default: ToDo)
   * 
   * @returns {void}
   * 
   * @example
   * // Open dialog to add new task with ToDo status
   * this.openDialogAddTask();
   * // On desktop: Modal opens; On mobile: Routes to /add-task page
   */
  openDialogAddTask(status: TaskStatus = TaskStatus.ToDo) {
    this.dialogAddTask.open(status);
    const mq = window.matchMedia('(max-width: 980px)');
if (mq.matches) {
  this.router.navigate(['/add-task'], { queryParams: { status } });
} 
  } 
     

  /**
   * Handles task card click and opens the task details/edit dialog
   * 
   * Validates that the task has a valid ID before opening the edit dialog.
   * Extracts the full task details from the BoardTask object and opens
   * DialogShowEditTask for viewing/editing task information.
   * 
   * @param {BoardTask} task - The task card clicked by user (enriched with all details)
   * 
   * @returns {void}
   * 
   * @throws {Error} Will throw if dialogShowEditTask ViewChild is not initialized
   * 
   * @example
   * // Handle task card click
   * this.onTaskClick(boardTask);
   * // If task.id is valid: Edit dialog opens with task details
   */
  onTaskClick(task: BoardTask): void {
    if (!task.id) return;
    this.openDialogEditTask(task);
  }

  /**
   * Observable stream of enriched tasks with real-time data from Firestore
   * 
   * Subscribes to authentication state and returns tasks only for authenticated users.
   * Each task is enriched with:
   * - Subtask information (count, completion progress)
   * - Contact assignments (names, initials, colors)
   * - Full contact details for assigned users
   * 
   * Uses combineLatest to fetch related data (subtasks, assignments, contacts) in parallel
   * for optimal performance. Returns empty array if user not authenticated or no tasks exist.
   * 
   * @type {Observable<BoardTask[]>}
   */
  readonly tasks$: Observable<BoardTask[]> = authState(inject(Auth)).pipe(
    switchMap((user) => {
      if (!user) return of([]);

      return this.firebase.subTasks().pipe(
        switchMap((tasks: Task[]) => {
          if (tasks.length === 0) return of([]);
          return combineLatest(tasks.map((task) => this.enrichTask(task)));
        }),
      );
    }),
  );

  /**
   * Observable stream of tasks with ToDo status
   * Filtered from main tasks$ stream for column display
   * 
   * @type {Observable<BoardTask[]>}
   */
  readonly todo$ = this.filterByStatus(TaskStatus.ToDo);

  /**
   * Observable stream of tasks with InProgress status
   * Filtered from main tasks$ stream for column display
   * 
   * @type {Observable<BoardTask[]>}
   */
  readonly inProgress$ = this.filterByStatus(TaskStatus.InProgress);

  /**
   * Observable stream of tasks with AwaitFeedback status
   * Filtered from main tasks$ stream for column display
   * 
   * @type {Observable<BoardTask[]>}
   */
  readonly awaitFeedback$ = this.filterByStatus(TaskStatus.AwaitFeedback);

  /**
   * Observable stream of tasks with Done status
   * Filtered from main tasks$ stream for column display
   * 
   * @type {Observable<BoardTask[]>}
   */
  readonly done$ = this.filterByStatus(TaskStatus.Done);

  /**
   * Handles drag-and-drop of tasks between status columns
   * 
   * Updates the task's status in Firestore when dropped in a different column.
   * Works with Angular CDK drag-drop events. Task status is updated to match
   * the drop target column's status. If task has no ID, operation is skipped.
   * 
   * @async
   * @param {CdkDragDrop<BoardTask[]>} event - CDK drag-drop event with task data
   * @param {TaskStatus} status - The target status (column) where task was dropped
   * 
   * @returns {Promise<void>}
   * 
   * @throws {Error} Will throw if Firestore update fails
   * 
   * @example
   * // Handle task dropped in InProgress column
   * await this.drop(dropEvent, TaskStatus.InProgress);
   * // Task status updated in Firestore from ToDo to InProgress
   */
  async drop(event: CdkDragDrop<BoardTask[]>, status: TaskStatus): Promise<void> {
    const task = event.item.data;
    if (task.id) {
      await this.firebase.updateTaskStatus(task.id, status);
    }
  }

  /**
   * Filters tasks by status from the main tasks$ stream
   * 
   * Returns a new observable that only emits tasks matching the specified status.
   * Used internally to create status-specific streams for each kanban column.
   * 
   * @private
   * @param {TaskStatus} status - Status to filter by (ToDo, InProgress, AwaitFeedback, Done)
   * 
   * @returns {Observable<BoardTask[]>} Observable of tasks with matching status only
   * 
   * @example
   * // Get only todo tasks
   * const todoTasks$ = this.filterByStatus(TaskStatus.ToDo);
   * // Emits BoardTask[] with status === TaskStatus.ToDo
   */
  private filterByStatus(status: TaskStatus): Observable<BoardTask[]> {
    return this.tasks$.pipe(map((tasks) => tasks.filter((task) => task.status === status)));
  }

  /**
   * Enriches a task with subtask and contact assignment data from Firestore
   * 
   * Fetches related subtasks and contact assignments for a task, calculates progress
   * percentage, and maps contact assignments to include names, initials, and colors.
   * Returns a complete BoardTask with all nested data ready for display.
   * 
   * If task has no assignments, returns empty assigns array. If contact data is missing,
   * uses fallback contact object with empty values and the contact ID.
   * 
   * @private
   * @param {Task} task - Base task object from Firestore
   * 
   * @returns {Observable<BoardTask>} Complete task with enriched assignment and subtask data
   * 
   * @throws {Error} Will throw if contact lookup fails in Firestore
   * 
   * @example
   * // Enrich a task with all related data
   * const enrichedTask$ = this.enrichTask(baseTask);
   * // Returns BoardTask with subtasks, assigns, and progress calculated
   */
  private enrichTask(task: Task): Observable<BoardTask> {
    return combineLatest([
      this.firebase.subSubtasks(task.id!),
      this.firebase.subTaskAssigns(task.id!),
    ]).pipe(
      switchMap(([subtasks, assigns]) => {
        const done = subtasks.filter((st) => st.done).length;
        const total = subtasks.length;

        if (!assigns || assigns.length === 0) {
          return of({
            ...task,
            assigns: [] as TaskAssign[],
            subtasks,
            subtasksDone: done,
            subtasksTotal: total,
            progress: total === 0 ? 0 : Math.round((done / total) * 100),
          } as BoardTask);
        }

        const assignObservables = assigns.map((a: TaskAssignDb) =>
          this.firebase.subSingleContact(a.contactId).pipe(
            map((contact) => {
              const c = contact
                ? this.firebase.toContact(contact)
                : { id: a.contactId, name: '', email: '', phone: '', color: '' };
              const name = c.name ?? '';
              return {
                contactId: a.contactId,
                name,
                initials: this.userUi.getInitials(name),
                color: c.color ?? '',
              } as TaskAssign;
            }),
          ),
        );

        return combineLatest(assignObservables).pipe(
          map((mappedAssigns: TaskAssign[]) => ({
            ...task,
            assigns: mappedAssigns,
            subtasks,
            subtasksDone: done,
            subtasksTotal: total,
            progress: total === 0 ? 0 : Math.round((done / total) * 100),
          })),
        );
      }),
    );
  }

  /**
   * Opens the edit task dialog with full task details
   * 
   * Displays a modal dialog with complete task information for viewing and editing.
   * Passes the enriched BoardTask to the dialog component which handles form submission
   * and updates to Firestore.
   * 
   * @param {BoardTask} task - The complete task object with all enriched data
   * 
   * @returns {void}
   * 
   * @throws {Error} Will throw if dialogShowEditTask ViewChild is not initialized
   * 
   * @example
   * // Open edit dialog for a task
   * this.openDialogEditTask(boardTask);
   * // Dialog opens with task data pre-filled
   */
  openDialogEditTask(task: BoardTask) {
    this.dialogShowEditTask.open(task);
  }
}
