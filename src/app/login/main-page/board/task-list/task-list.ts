import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskPreview } from '../task-preview/task-preview';
import { FirebaseServices } from '../../../../firebase-services/firebase-services';
import { UserUiService } from '../../../../services/user-ui.service';
import { Task } from '../../../../interfaces/task.interface';
import { BoardTask } from '../../../../interfaces/task-board.interface';
import { TaskAssign } from '../../../../interfaces/task-assign.interface';
import { TaskStatus } from '../../../../types/task-status';
import { Observable, combineLatest, map, switchMap, from } from 'rxjs';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, CdkDrag, CdkDropList, CdkDropListGroup, TaskPreview],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.scss'],
})
export class TaskList {
  TaskStatus = TaskStatus;

  private readonly firebase = inject(FirebaseServices);
  private readonly userUi = inject(UserUiService);

  readonly tasks$: Observable<BoardTask[]> = this.firebase
    .subTasks()
    .pipe(
      switchMap((tasks: Task[]) =>
        combineLatest(tasks.map((task) => this.enrichTask(task)))
      )
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
      this.firebase.subContactsList(),
    ]).pipe(
      switchMap(([subtasks, assigns, contacts]) => from(this.mapAssigns(subtasks, assigns, contacts, task)))
    );
  }

  private async mapAssigns(
    subtasks: any[],
    assigns: any[],
    contacts: any[],
    task: Task
  ): Promise<BoardTask> {
    const uiAssigns: TaskAssign[] = [];

    for (const assign of assigns) {
      const contact = contacts.find((c) => c.id === assign.contactId);
      if (!contact) continue;

      const colorIndex = await this.userUi.getNextColorIndex();
      const colorHex = this.userUi.getColorByIndex(colorIndex);

      uiAssigns.push({
        contact,
        initials: this.userUi.getInitials(contact.name),
        color: colorHex,
        id: assign.id,
      });
    }

    const done = subtasks.filter((st) => st.done).length;
    const total = subtasks.length;

    return {
      ...task,
      assigns: uiAssigns,
      subtasks,
      subtasksDone: done,
      subtasksTotal: total,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  }
}
