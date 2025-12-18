import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-task-preview',
  imports: [
    CommonModule,
    CdkDrag,
    CdkDropList,
    CdkDropListGroup
  ],
  templateUrl: './task-preview.html',
  styleUrl: './task-preview.scss',
})
export class TaskPreview {

  todoTasks: string[] = ['Test Task'];
  inProgressTasks: string[] = [];
  awaitFeedbackTasks: string[] = [];
  doneTasks: string[] = [];

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
