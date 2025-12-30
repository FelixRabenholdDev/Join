import { Component, signal, effect, ViewChildren, QueryList, ElementRef,ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FirebaseServices } from '../../../firebase-services/firebase-services';
import { Contact } from '../../../interfaces/contact.interface';
import { Task } from '../../../interfaces/task.interface';
import { Subtask } from '../../../interfaces/subtask.interface';
import { TaskType } from '../../../types/task-type';
import { TaskStatus } from '../../../types/task-status';
import { MatDatepickerModule,MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { UserUiService } from '../../../services/user-ui.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './add-task.html',
  styleUrls: ['./add-task.scss'],
})
export class AddTask {
  subtaskInput = '';
  subtasks: Subtask[] = [];
  showIcons = false;
  editIndex: number | null = null;
@ViewChild('picker') picker!: MatDatepicker<any>;
  @ViewChildren('editInput') editInputs!: QueryList<ElementRef<HTMLInputElement>>;
dueDateTouched = false
  isDatepickerOpen = false;


  isTouched = false;
taskTypeTouched = false;
taskTypeFocused = false;
taskTypeError = false;

get showTaskTypeError(): boolean {
  return (
    this.taskTypeTouched &&
    !this.taskTypeFocused &&
    !this.selectedTaskType()
  );
}

onTaskTypeFocus() {
  this.taskTypeFocused = true;
}

onTaskTypeBlur() {
  this.taskTypeError = !this.selectedTaskType();
}

onTaskTypeChange(value: TaskType | null) {
  this.selectedTaskType.set(value);

 
  this.taskTypeError = false;
}
  

onTouched() {
  this.isTouched = true;
}

onChange(value: TaskType | null) {
  this.selectedTaskType.set(value);
}


onCalendarClosed() {
  
  if (!this.dueDate()) {
    this.dueDateTouched = true;
  }
}

onDateChange(event: any) {
  // Fehler zurücksetzen, da jetzt ein Datum gewählt wurde
  this.dueDateTouched = false;
  this.dueDate.set(event.value); // Signal aktualisieren
}

  editSubtask(index: number) {
    this.editIndex = index;

    queueMicrotask(() => {
      const elRef = this.editInputs.toArray()[index];
      elRef?.nativeElement?.focus();
      elRef?.nativeElement?.select();
    });
  }

  saveEdit() {
    this.editIndex = null;
  }

  deleteSubtask(index: number) {
    this.subtasks.splice(index, 1);
  }

  trackByIndex(index: number) {
    return index;
  }

  addSubtask() {
    const title = this.subtaskInput.trim();
    if (!title) return;

    this.subtasks.push({ title, done: false });

    this.subtaskInput = '';
  }

  onBlur() {
    if (!this.subtaskInput.trim()) {
      this.showIcons = false;
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  isAssigned(contact: Contact): boolean {
    return this.assignedTo().some(function (c) {
      return c.id === contact.id;
    });
  }

  toggleContact(contact: Contact, checked: boolean) {
    const current = this.assignedTo();
    if (checked) {
      if (
        !current.some(function (c) {
          return c.id === contact.id;
        })
      ) {
        this.assignedTo.set([...current, contact]);
      }
    } else {
      this.assignedTo.set(
        current.filter(function (c) {
          return c.id !== contact.id;
        })
      );
    }
  }

  // Signals
  assignedTo = signal<Contact[]>([]);
  selectedTaskType = signal<TaskType | null>(null);
  priority = signal<'urgent' | 'medium' | 'low' | null>(null);
  title = signal('');
  description = signal('');
  dueDate = signal('');
  contacts = signal<Contact[]>([]);

  taskTypes = Object.entries(TaskType)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({ name: key, value: value as TaskType }));

  assignedToText: string = '';
  selectOpened = false;
  menuOpen = false;

  constructor(private firebase: FirebaseServices, public userUi: UserUiService, private router: Router) {
    this.firebase.subContactsList().subscribe((data) => this.contacts.set(data));

    

    

    effect(() => {
      console.log('AssignedTo:', this.assignedTo());
      console.log('TaskType:', this.selectedTaskType());
      console.log('Priority:', this.priority());
    });
  }

  updateAssignedToText(opened?: boolean) {
    if (opened !== undefined) {
      this.selectOpened = opened;
    }

    if (this.assignedTo().length > 0) {
      this.assignedToText = this.assignedTo()
        .map((c) => c.name)
        .join(', ');
    } else {
      this.assignedToText = '';
    }
  }

  setPriority(p: 'urgent' | 'medium' | 'low') {
    this.priority.set(this.priority() === p ? null : p);
  }
taskAddedMessage = signal('');
taskErrorMessage = signal('');
  async  createTask() {

    
    const prio = this.priority();
    if (!this.title() || !this.selectedTaskType() || !prio || !this.dueDate()) {
     this.taskErrorMessage.set('Please fill all required fields!');
    setTimeout(() => this.taskErrorMessage.set(''), 2000);
    return
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
      const taskId = createdTask.id!;

      for (const contact of this.assignedTo()) {
        const colorIndex = await this.userUi.getNextColorIndex();
        const colorHex = this.userUi.getColorByIndex(colorIndex);

        await this.firebase.addTaskAssign(taskId, {
          contactId: contact.id,
          name:contact.name,
          initials: this.userUi.getInitials(contact.name),
          color: colorHex,
        });
      }

      for (const subtask of this.subtasks) {
        await this.firebase.addSubtask(taskId, { title: subtask.title, done: false });
      }
 this.taskAddedMessage.set('Task added to board');

setTimeout(() => {
  this.taskAddedMessage.set('');
  this.router.navigate(['/board']);
}, 1000);

  } catch (err) {
    console.error(err);
    this.taskErrorMessage.set('Add failed');
    setTimeout(() => this.taskErrorMessage.set(''), 1000);
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
selectedAssignedContacts: Contact[] = [];
currentAssignedSelection: Contact[] = [];

resetForm() {
  this.title.set('');
  this.description.set('');
  this.dueDate.set('');
  this.selectedTaskType.set(null);
  this.priority.set(null);

  this.subtasks = [];
  this.subtaskInput = '';
  this.showIcons = false;
  this.editIndex = null;

  this.taskTypeError = false;
  this.taskTypeTouched = false;
  this.taskTypeFocused = false;
  this.dueDateTouched = false;

  this.selectOpened = false;
  this.assignedToText = '';

  this.currentAssignedSelection = [];

  this.picker?.close?.();
  this.menuOpen = false;
}






}