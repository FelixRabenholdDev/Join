import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { FirebaseServices } from '../../../firebase-services/firebase-services';
import { Contact } from '../../../interfaces/contact.interface';
import { Task } from '../../../interfaces/task.interface';
import { TaskType } from '../../../types/task-type';
import { TaskStatus } from '../../../types/task-status';


@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, FormsModule],
  templateUrl: './add-task.html',
  styleUrls: ['./add-task.scss'],
})

export class AddTask {
  // Signals
  assignedTo = signal<Contact[]>([]);
  selectedTaskType = signal<TaskType | null>(null);
  priority = signal<'urgent' | 'medium' | 'low' | null>(null);
  

  // Form inputs
  title = signal('');
  description = signal('');
  dueDate = signal('');

  // Daten
  contacts = signal<Contact[]>([]);
  taskTypes = Object.entries(TaskType)
    .filter(([key, value]) => typeof value === 'number')
    .map(([key, value]) => ({ name: key, value: value as TaskType }));

  constructor(private firebase: FirebaseServices) {
    this.firebase.subContactsList().subscribe((data) => this.contacts.set(data));

    effect(() => {
      console.log('AssignedTo:', this.assignedTo());
      console.log('TaskType:', this.selectedTaskType());
      console.log('Priority:', this.priority());
    });
  }

  setPriority(p: 'urgent' | 'medium' | 'low') {
    this.priority.set(this.priority() === p ? null : p);
  }

  async createTask() {
    const prio = this.priority();
    if (!this.title() || !this.selectedTaskType() || !prio || !this.dueDate()) {
      alert('Please fill all required fields!');
      return;
    }

    const newTask: Omit<Task, 'id'> = {
      title: this.title(),
      description: this.description(),
      date: this.dueDate(),
      type: this.selectedTaskType()!,
      status: TaskStatus.ToDo,
      priority: this.getPriorityNumber(prio),
    };

    try {
      const createdTask = await this.firebase.addTask(newTask);

      for (const contact of this.assignedTo()) {
        await this.firebase.addTaskAssign(createdTask.id!, contact);
      }

      alert('Task created successfully!');
      this.resetForm();
    } catch (err) {
      console.error(err);
      alert('Error creating task.');
    }
  }

  getPriorityNumber(p: 'urgent' | 'medium' | 'low') {
    switch (p) {
      case 'urgent':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
    }
  }

  resetForm() {
    this.title.set('');
    this.description.set('');
    this.dueDate.set('');
    this.priority.set(null);
    this.assignedTo.set([]);
    this.selectedTaskType.set(null);
  }
}