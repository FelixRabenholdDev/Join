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

  TaskStatus = TaskStatus;

  searchInput: string = '';
  isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  dragDelay = this.isMobile ? 400 : 0;

  @ViewChild(DialogAddTask) dialogAddTask!: DialogAddTask;
  @ViewChild(DialogShowEditTask) dialogShowEditTask!: DialogShowEditTask;

  openDialogAddTask(status: TaskStatus = TaskStatus.ToDo) {
    this.dialogAddTask.open(status);
    const mq = window.matchMedia('(max-width: 980px)');
if (mq.matches) {
  this.router.navigate(['/add-task'], { queryParams: { status } });
} 
  } 
     


  onTaskClick(task: BoardTask): void {
    if (!task.id) return;
    this.openDialogEditTask(task);
  }

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

  readonly todo$ = this.filterByStatus(TaskStatus.ToDo);
  readonly inProgress$ = this.filterByStatus(TaskStatus.InProgress);
  readonly awaitFeedback$ = this.filterByStatus(TaskStatus.AwaitFeedback);
  readonly done$ = this.filterByStatus(TaskStatus.Done);

  async drop(event: CdkDragDrop<BoardTask[]>, status: TaskStatus): Promise<void> {
    const task = event.item.data;
    if (task.id) {
      await this.firebase.updateTaskStatus(task.id, status);
    }
  }

  private filterByStatus(status: TaskStatus): Observable<BoardTask[]> {
    return this.tasks$.pipe(map((tasks) => tasks.filter((task) => task.status === status)));
  }

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

  openDialogEditTask(task: BoardTask) {
    this.dialogShowEditTask.open(task);
  }
}
