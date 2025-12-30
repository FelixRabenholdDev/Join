import { Component, inject,ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskPreview } from '../task-preview/task-preview';
import { FirebaseServices } from '../../../../firebase-services/firebase-services';
import { Task } from '../../../../interfaces/task.interface';
import { BoardTask } from '../../../../interfaces/task-board.interface';
import { TaskAssign } from '../../../../interfaces/task-assign.interface';
import { TaskAssignDb } from '../../../../interfaces/task-assign-db.interface';
import { TaskStatus } from '../../../../types/task-status';
import { Observable, combineLatest, map, switchMap, from, of } from 'rxjs';
import { UserUiService } from '../../../../services/user-ui.service';
import { DialogAddTask } from '../dialog-add-task/dialog-add-task';


@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, CdkDrag, CdkDropList, CdkDropListGroup, TaskPreview,DialogAddTask],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.scss'],
})
export class TaskList {
  TaskStatus = TaskStatus;

 @ViewChild('addTaskDialog') addTaskDialog!: DialogAddTask;

openAddTaskDialog() {
  this.addTaskDialog.open();
}

  private readonly firebase = inject(FirebaseServices);
  private readonly userUi = inject(UserUiService);

  readonly tasks$: Observable<BoardTask[]> = this.firebase
    .subTasks()
    .pipe(switchMap((tasks: Task[]) => combineLatest(tasks.map((task) => this.enrichTask(task)))));

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
      const done = subtasks.filter(st => st.done).length;
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
              const c = contact ? this.firebase.toContact(contact) : { id: a.contactId, name: '', email: '', phone: '', color: '' };
              const name = c.name ?? '';
              return {
                contactId: a.contactId,
                name,
                initials: this.userUi.getInitials(name),
                color: c.color ?? '',
              } as TaskAssign;
            })
          )
        );

      return combineLatest(assignObservables).pipe(
          map((mappedAssigns: TaskAssign[]) => ({
            ...task,
            assigns: mappedAssigns,
            subtasks,
            subtasksDone: done,
            subtasksTotal: total,
            progress: total === 0 ? 0 : Math.round((done / total) * 100),
          }))
        );
      })
    );
  }
}