import { Component } from '@angular/core';



@Component({
  selector: 'app-add-task',
  standalone:true,
  imports: [],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask {
  priority: 'urgent' | 'medium' | 'low' | null = null;

  setPriority(p: 'urgent' | 'medium' | 'low') {
    if (this.priority === p) {
      this.priority = null;
    } else {
      this.priority = p;
    }
  }
}


