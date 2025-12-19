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
    selector: 'app-task-list',
    imports: [
        CommonModule,
        CdkDrag,
        CdkDropList,
        CdkDropListGroup,
    ],
    templateUrl: './task-list.html',
    styleUrl: './task-list.scss',
})
export class TaskList {

    todoTasks: string[] = ['Test Task 1'];
    inProgressTasks: string[] = ['Test Task 2'];
    awaitFeedbackTasks: string[] = ['Test Task 3'];
    doneTasks: string[] = ['Test Task 4'];

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
