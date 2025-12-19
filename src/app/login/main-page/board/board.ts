import { Component, ViewChild } from '@angular/core';
import { TaskList } from './task-list/task-list';
import { DialogAddTask } from './dialog-add-task/dialog-add-task';

@Component({
  selector: 'app-board',
  imports: [TaskList, DialogAddTask],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {

  @ViewChild(DialogAddTask) dialogAddTask!: DialogAddTask;

  openDialogAddTask() {
    this.dialogAddTask.open();
  }
}
