import { Component, ViewChild } from '@angular/core';
import { TaskList } from './task-list/task-list';
import { DialogAddTask } from './dialog-add-task/dialog-add-task';
import { DialogShowEditTask } from './task-preview/dialog-show-edit-task/dialog-show-edit-task';

@Component({
  selector: 'app-board',
  imports: [TaskList, DialogAddTask,DialogShowEditTask],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {

  @ViewChild(DialogAddTask) dialogAddTask!: DialogAddTask;

  openDialogAddTask() {
    this.dialogAddTask.open();
  }
}
