import { Component, signal, ViewChildren, QueryList, ElementRef, ViewChild, inject } from '@angular/core';
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
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { UserUiService } from '../../../services/user-ui.service';
import { Router } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';

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

private firebase = inject(FirebaseServices);
 
  title = signal('');
  description = signal('');
  dueDate = signal<Date | null>(null);
 minDate = signal<Date>(new Date());
  selectedTaskType = signal<TaskType | null>(null);
  priority = signal<'urgent' | 'medium' | 'low' | null>(null);
  contacts = toSignal(this.firebase.subContactsList(), { initialValue: [] as Contact[] });
  assignedTo = signal<Contact[]>([]);

  subtaskInput = '';
  subtasks: Subtask[] = [];
  showIcons = false;
  editIndex: number | null = null;
  @ViewChildren('editInput') editInputs!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChild('picker') picker!: MatDatepicker<any>;

  menuOpen = false;
  dueDateTouched = false;
  isDatepickerOpen = false;
  isTouched = false;
  taskTypeTouched = false;
  taskTypeFocused = false;
  taskTypeError = false;
  assignedToText: string = '';
  selectOpened = false;

  taskAddedMessage = signal('');
  taskErrorMessage = signal('');

  taskTypes = Object.entries(TaskType)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({ name: key, value: value as TaskType }));

  constructor(    
    public userUi: UserUiService,
    private router: Router,
    
  ) {  const today = new Date();
  today.setHours(0, 0, 0, 0); // nur Datum ohne Zeit
  this.minDate.set(today);
  }


  
  addSubtask() {
    const title = this.subtaskInput.trim();
    if (!title) return;
    this.subtasks.push({ title, done: false });
    this.subtaskInput = '';
  }

  clearInput() {
    this.subtaskInput = '';
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

  onBlur() {
    if (!this.subtaskInput.trim()) {
      this.showIcons = false;
    }
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

  get showTaskTypeError(): boolean {
    return this.taskTypeTouched && !this.taskTypeFocused && !this.selectedTaskType();
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
    this.dueDateTouched = false;
    this.dueDate.set(event.value as Date);
  }

  setPriority(p: 'urgent' | 'medium' | 'low') {
    this.priority.set(this.priority() === p ? null : p);
  }

  getPriorityNumber(p: 'urgent' | 'medium' | 'low') {
    switch (p) {
      case 'urgent':
        return 1;
      case 'medium':
        return 2;
      case 'low':
        return 3;
    }
  }

  isAssigned(contact: Contact): boolean {
    return this.assignedTo().some((c) => c.id === contact.id);
  }

  toggleContact(contact: Contact, checked: boolean) {
    const current = this.assignedTo();
    if (checked) {
      if (!current.some((c) => c.id === contact.id)) {
        this.assignedTo.set([...current, contact]);
      }
    } else {
      this.assignedTo.set(current.filter((c) => c.id !== contact.id));
    }
    this.updateAssignedToText();
  }

  updateAssignedToText() {
    this.assignedToText = this.assignedTo()
      .map((c) => c.name)
      .join(', ');
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  async createTask() {
    const prio = this.priority();
    if (!this.title() || !this.selectedTaskType() || !prio || !this.dueDate()) {
      this.taskErrorMessage.set('Please fill all required fields!');
      setTimeout(() => this.taskErrorMessage.set(''), 1000);
      return;
    }

    const newTask: Omit<Task, 'id'> = {
      title: this.title(),
      description: this.description(),
      date: Timestamp.fromDate(this.dueDate()!),
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
          name: contact.name,
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

  resetForm() {
    this.title.set('');
    this.description.set('');
    this.dueDate.set(null);
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
    this.assignedTo.set([]);

    this.picker?.close?.();
    this.menuOpen = false;
  }
}
