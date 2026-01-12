import { Component, ViewChild, signal, inject } from '@angular/core';
import { Dialog } from '../../../../../shared/dialog/dialog';
import { BoardTask } from '../../../../../interfaces/task-board.interface';
import { TaskType } from '../../../../../types/task-type';
import { CommonModule } from '@angular/common';
import { FirebaseServices } from '../../../../../firebase-services/firebase-services';
import { Contact } from '../../../../../interfaces/contact.interface';
import { Timestamp } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserUiService } from '../../../../../services/user-ui.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-dialog-show-edit-task',
  standalone: true,
  imports: [CommonModule, Dialog, FormsModule, MatSelectModule, MatFormFieldModule, RouterModule],
  templateUrl: './dialog-show-edit-task.html',
  styleUrls: ['./dialog-show-task.scss', './dialog-edit-task.scss']
})
export class DialogShowEditTask {
  @ViewChild('DialogShowEditTask') dialog!: Dialog;

  private readonly firebase = inject(FirebaseServices);
  private readonly userUi = inject(UserUiService);

  readonly task = signal<BoardTask | null>(null);
  readonly contacts = signal<Contact[]>([]);

  readonly TaskType = TaskType;
  isEditMode: boolean = false;
  editData: any = {
    title: '',
    description: '',
    date: '',
    priority: 2,
    assigns: [],
    subtasks: [],
  };

  newSubtaskTitle: string = '';

  constructor() {
    this.firebase.subContactsList()
    .pipe(takeUntilDestroyed())
    .subscribe(contacts => {
      this.contacts.set(contacts);
    });
  }

  open(task: BoardTask): void {
    this.task.set(task);
    this.isEditMode = false;
    this.dialog.open();
  }

  close(): void {
    this.dialog.close();
  }

  get taskTypeSvg(): string {
    if (!this.task()) return '';
    switch (this.task()!.type) {
      case TaskType.UserStory:
        return 'img/task_type_user_story.svg';
      case TaskType.TechnicalTask:
        return 'img/task_type_technical_task.svg';
      default:
        return '';
    }
  }

  switchPage(): void {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode && this.task()) {
      const t = this.task()!;
      this.editData = {
        ...t,
        date: new Date(t.date.seconds * 1000).toISOString().split('T')[0],
        assigns: t.assigns ? t.assigns.map((a) => ({ ...a })) : [],
        subtasks: t.subtasks ? t.subtasks.map((s) => ({ ...s })) : [],
      };
    }
  }

  /* ----------------------------- Edit Logik ---------------------------- */

  setPrio(prio: number) {
    this.editData.priority = prio;
  }

  addSubtask() {
    if (this.newSubtaskTitle.trim()) {
      this.editData.subtasks.push({
        title: this.newSubtaskTitle,
        done: false,
      });
      this.newSubtaskTitle = '';
    }
  }

  removeSubtask(index: number) {
    this.editData.subtasks.splice(index, 1);
  }

  getInitials(name: string): string {
   return this.userUi.getInitials(name);
  }

  async toggleSubtask(index: number, task: BoardTask) {
    if (!task.subtasks || !task.subtasks[index]) return;
    const subtask = task.subtasks[index];
    subtask.done = !subtask.done;
    if (task.id && subtask.id) {
      await this.firebase.editSubtask(task.id, subtask.id, { done: subtask.done });
    }
  }

  async deleteTask(): Promise<void> {
    const taskId = this.task()?.id;
    if (!taskId) return;
    await this.firebase.deleteTaskWithChildren(taskId);
    this.close();
  }

  async saveTask() {
    const currentTask = this.task();
    if (!currentTask?.id) return;

    try {
      const taskId = currentTask.id;

      const updatedTask = {
        title: this.editData.title,
        description: this.editData.description,
        priority: this.editData.priority,
        date: Timestamp.fromDate(new Date(this.editData.date)),
      };
      await this.firebase.editTask({ id: taskId, ...updatedTask } as any);

      const currentDbAssigns = await firstValueFrom(this.firebase.subTaskAssigns(taskId));

      for (const dbA of currentDbAssigns) {
        const stillExists = this.editData.assigns.some((fa: any) => fa.contactId === dbA.contactId);
        if (!stillExists && dbA.id) {
          await this.firebase.deleteTaskAssign(taskId, dbA.id);
        }
      }

      for (const fa of this.editData.assigns) {
        const alreadyInDb = currentDbAssigns.some((dbA) => dbA.contactId === fa.contactId);
        if (!alreadyInDb) {
          await this.firebase.addTaskAssign(taskId, {
            contactId: fa.contactId,
            name: fa.name,
            color: fa.color,
            initials: fa.initials,
          });
        }
      }

      const currentDbSubtasks = await firstValueFrom(this.firebase.subSubtasks(taskId));

      for (const dbS of currentDbSubtasks) {
        if (!this.editData.subtasks.some((fs: any) => fs.title === dbS.title)) {
          if (dbS.id) await this.firebase.deleteSubtask(taskId, dbS.id);
        }
      }

      for (const fs of this.editData.subtasks) {
        if (!currentDbSubtasks.some((dbS) => dbS.title === fs.title)) {
          await this.firebase.addSubtask(taskId, { title: fs.title, done: fs.done || false });
        }
      }

      this.close();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  }

  selectOpened: boolean = false;

  getSelectedContacts(): Contact[] {
    return this.contacts().filter(c => 
      this.editData.assigns.some((a: any) => a.contactId === c.id)
    );
  }

  onSelectionChange(event: any) {
    const selectedContacts: Contact[] = event.value;
    this.editData.assigns = selectedContacts.map(c => ({
      contactId: c.id,
      name: c.name,
      color: c.color,
      initials: this.getInitials(c.name)
    }));
  }

}
