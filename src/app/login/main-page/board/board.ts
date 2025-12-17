import { Component } from '@angular/core';
import { TaskPreview } from './task-preview/task-preview';

@Component({
  selector: 'app-board',
  imports: [TaskPreview],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {

}
