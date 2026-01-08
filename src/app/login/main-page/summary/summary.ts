import { Component, inject } from '@angular/core';
import { FirebaseServices } from '../../../firebase-services/firebase-services';
import { TaskStatus } from '../../../types/task-status';
import { map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { UserUiService } from '../../../services/user-ui.service';
import { Task } from '../../../interfaces/task.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-summary',
  imports: [AsyncPipe],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary {
  private firebase = inject(FirebaseServices);
  private router = inject(Router);
  ui = inject(UserUiService);
  greeting = this.getGreeting();

  summary$ = this.firebase.subTasks().pipe(
    map((tasks) => {
      const upcoming = this.getNextDueTask(tasks);

      return {
        todo: tasks.filter((t) => t.status === TaskStatus.ToDo).length,
        inProgress: tasks.filter((t) => t.status === TaskStatus.InProgress).length,
        awaitFeedback: tasks.filter((t) => t.status === TaskStatus.AwaitFeedback).length,
        done: tasks.filter((t) => t.status === TaskStatus.Done).length,
        urgent: tasks.filter((t) => this.ui.isTaskUrgent(t.date)).length,
        total: tasks.length,
        nextDueDate: upcoming?.date ?? null,
      };
    })
  );

  toBoard() {
    this.router.navigate(['/board']);
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  }

  private getNextDueTask(tasks: Task[]): Task | null {
    return (
      tasks.filter((t) => t.date).sort((a, b) => a.date.toMillis() - b.date.toMillis())[0] ?? null
    );
  }
}
