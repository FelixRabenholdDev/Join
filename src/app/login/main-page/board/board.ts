import { Component } from '@angular/core';
import { TaskPreview } from './task-preview/task-preview';
import { DialogAddTask } from './dialog-add-task/dialog-add-task';

@Component({
  selector: 'app-board',
  imports: [TaskPreview,DialogAddTask],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {

}
