import {  Component, signal, ViewChildren, QueryList, ElementRef, ViewChild, inject,} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FirebaseServices } from '../../../../firebase-services/firebase-services';
import { Contact } from '../../../../interfaces/contact.interface';
import { Task } from '../../../../interfaces/task.interface';
import { Subtask } from '../../../../interfaces/subtask.interface';
import { TaskType } from '../../../../types/task-type';
import { TaskStatus } from '../../../../types/task-status';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { UserUiService } from '../../../../services/user-ui.service';
import { Router } from '@angular/router';
import { Dialog } from '../../../../shared/dialog/dialog';
import { Timestamp } from '@angular/fire/firestore';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Dialog Add Task Component (Board Version)
 * 
 * Modal dialog for creating new tasks from the kanban board view.
 * Similar functionality to AddTask page but in dialog form for quick
 * task creation without navigating away from the board.
 * 
 * Features:
 * - Modal dialog interface
 * - Task title and description input
 * - Priority selection (urgent, medium, low)
 * - Task type selection
 * - Status selection
 * - Due date picker
 * - Multi-select contact assignment
 * - Subtask management
 * - Form validation
 * - Cancel/Save operations
 * 
 * Dialog State:
 * - Opens as overlay
 * - Closes on cancel or successful save
 * - Emits closed event on completion
 * 
 * @component
 * @selector app-dialog-add-task
 * @standalone true
 */
@Component({
  selector: 'app-dialog-add-task',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    Dialog,
  ],
  templateUrl: './dialog-add-task.html',
  styleUrl: './dialog-add-task.scss',
})
export class DialogAddTask {
  private firebase = inject(FirebaseServices);
  public userUi = inject(UserUiService);
  private router = inject(Router);

  @ViewChild(Dialog) dialog!: Dialog;

  title = signal('');
  description = signal('');
  dueDate = signal<Date | null>(null);
  selectedTaskType = signal<TaskType | null>(null);
  priority = signal<'urgent' | 'medium' | 'low' | null>('medium');
  contacts = signal<Contact[]>([]);
  assignedTo = signal<Contact[]>([]);
  currentStatus = signal<TaskStatus>(TaskStatus.ToDo);

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

  /**
   * Available task types from TaskType enum
   * Maps enum keys to numeric values for display and selection
   * 
   * @type {{name: string, value: TaskType}[]}
   */
  taskTypes = Object.entries(TaskType)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({ name: key, value: value as TaskType }));

  /**
   * Opens the add task dialog with an optional initial status
   * 
   * Resets the form to initial state, sets the current status for the task,
   * and opens the dialog component. Used when user clicks "Add Task" from board column headers.
   * 
   * @param {TaskStatus} status - Initial task status (default: ToDo)
   * 
   * @returns {void}
   * 
   * @example
   * // Open dialog for new InProgress task
   * this.open(TaskStatus.InProgress);
   * // Dialog opens with empty form, status set to InProgress
   */
  open(status: TaskStatus = TaskStatus.ToDo) {
    this.resetForm();
    this.currentStatus.set(status);
    this.dialog.open();
  }

  /**
   * Component constructor
   * 
   * Subscribes to the Firebase contacts list to keep the local contacts signal
   * updated with all available contacts for assignment. Automatically unsubscribes
   * when component is destroyed.
   */
  constructor() {
    this.firebase
      .subContactsList()
      .pipe(takeUntilDestroyed())
      .subscribe((data) => this.contacts.set(data));
  }

  /**
   * Adds a new subtask to the task being created
   * 
   * Validates input is not empty, creates Subtask object with title and done=false,
   * adds to subtasks array, and clears input field. Similar to AddTask component.
   * 
   * @returns {void}
   */
  addSubtask() {
    const title = this.subtaskInput.trim();
    if (!title) return;
    this.subtasks.push({ title, done: false });
    this.subtaskInput = '';
  }

  /**
   * Enters edit mode for a subtask at the specified index
   * 
   * Sets editIndex and focuses/selects the corresponding input element.
   * Uses queueMicrotask to ensure DOM updates before focusing.
   * 
   * @param {number} index - Index of subtask to edit
   * 
   * @returns {void}
   */
  editSubtask(index: number) {
    this.editIndex = index;
    queueMicrotask(() => {
      const elRef = this.editInputs.toArray()[index];
      elRef?.nativeElement?.focus();
      elRef?.nativeElement?.select();
    });
  }

  /**
   * Saves the edited subtask and exits edit mode
   * 
   * Sets editIndex to null to close edit mode and finalize changes.
   * 
   * @returns {void}
   */
  saveEdit() {
    this.editIndex = null;
  }

  /**
   * Deletes a subtask from the list by index
   * 
   * Removes the subtask at specified index from subtasks array.
   * 
   * @param {number} index - Index of subtask to delete
   * 
   * @returns {void}
   */
  deleteSubtask(index: number) {
    this.subtasks.splice(index, 1);
  }

  /**
   * TrackBy function for subtask *ngFor loop
   * 
   * Returns index for DOM element tracking/reuse efficiency.
   * 
   * @param {number} index - Index of the subtask
   * 
   * @returns {number} Index for DOM tracking
   */
  trackByIndex(index: number) {
    return index;
  }

  /**
   * Handles blur event on subtask input field
   * 
   * Hides action icons if input is empty and loses focus.
   * 
   * @returns {void}
   */
  onBlur() {
    if (!this.subtaskInput.trim()) {
      this.showIcons = false;
    }
  }

  /**
   * Handles focus event on task type field
   * 
   * Sets taskTypeFocused flag to true, used for validation error display logic.
   * 
   * @returns {void}
   */
  onTaskTypeFocus() {
    this.taskTypeFocused = true;
  }

  /**
   * Handles blur event on task type field
   * 
   * Sets taskTypeError to true if no task type is selected when field loses focus.
   * Used to trigger error message display.
   * 
   * @returns {void}
   */
  onTaskTypeBlur() {
    this.taskTypeError = !this.selectedTaskType();
  }

  /**
   * Handles task type value changes from dropdown
   * 
   * Updates the selectedTaskType signal with the new value and clears any
   * previous error state. Called when user selects a task type from dropdown.
   * 
   * @param {TaskType | null} value - Selected task type or null if cleared
   * 
   * @returns {void}
   */
  onTaskTypeChange(value: TaskType | null) {
    this.selectedTaskType.set(value);
    this.taskTypeError = false;
  }

  /**
   * Computes if task type error should be displayed
   * 
   * Returns true if field has been touched, doesn't have focus, and no task type selected.
   * Used for conditional error message rendering in template.
   * 
   * @returns {boolean} True if error should be shown
   */
  get showTaskTypeError(): boolean {
    return this.taskTypeTouched && !this.taskTypeFocused && !this.selectedTaskType();
  }

  /**
   * Marks form as touched after first interaction
   * 
   * Used to control when validation errors are displayed to user.
   * 
   * @returns {void}
   */
  onTouched() {
    this.isTouched = true;
  }

  /**
   * Handles task type value changes for form control
   * 
   * Updates the selectedTaskType signal when value changes.
   * 
   * @param {TaskType | null} value - Selected task type or null
   * 
   * @returns {void}
   */
  onChange(value: TaskType | null) {
    this.selectedTaskType.set(value);
  }

  /**
   * Handles datepicker close event
   * 
   * If no date is selected when picker closes, marks dueDateTouched as true
   * to show validation error.
   * 
   * @returns {void}
   */
  onCalendarClosed() {
    if (!this.dueDate()) {
      this.dueDateTouched = true;
    }
  }

  /**
   * Handles date selection from datepicker
   * 
   * Updates the dueDate signal with selected date and clears the dueDateTouched flag.
   * Called when user picks a date from Material datepicker.
   * 
   * @param {any} event - Material datepicker event with value property
   * 
   * @returns {void}
   */
  onDateChange(event: any) {
    this.dueDateTouched = false;
    this.dueDate.set(event.value as Date);
  }

  /**
   * Toggles priority level or clears if same priority clicked again
   * 
   * Sets the priority to the specified level, or clears it (null) if user
   * clicks the same priority button again. Used for toggle behavior.
   * 
   * @param {'urgent' | 'medium' | 'low'} p - Priority level to toggle
   * 
   * @returns {void}
   * 
   * @example
   * // Toggle urgent priority
   * this.setPriority('urgent');
   * // Sets to 'urgent', or clears if already 'urgent'
   */
  setPriority(p: 'urgent' | 'medium' | 'low') {
    this.priority.set(this.priority() === p ? null : p);
  }

  /**
   * Converts priority string to numeric value for database storage
   * 
   * Maps priority strings to numbers:
   * - 'urgent' → 1
   * - 'medium' → 2
   * - 'low' → 3
   * 
   * @param {'urgent' | 'medium' | 'low'} p - Priority string
   * 
   * @returns {1 | 2 | 3} Numeric priority value
   * 
   * @example
   * // Get numeric value for priority
   * this.getPriorityNumber('urgent'); // Returns 1
   * this.getPriorityNumber('low'); // Returns 3
   */
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

  /**
   * Checks if a contact is already assigned to this task
   * 
   * Searches the assignedTo signal for a contact with matching ID.
   * Used to mark checkboxes as checked in the contact selection dropdown.
   * 
   * @param {Contact} contact - Contact to check
   * 
   * @returns {boolean} True if contact is in assignedTo list
   * 
   * @example
   * // Check if John is assigned
   * this.isAssigned(johnContact); // Returns true/false
   */
  isAssigned(contact: Contact): boolean {
    return this.assignedTo().some((c) => c.id === contact.id);
  }

  /**
   * Toggles a contact's assignment to this task
   * 
   * If checked=true, adds contact to assignedTo list (if not already there).
   * If checked=false, removes contact from assignedTo list.
   * Updates the assignedToText display after toggle.
   * 
   * @param {Contact} contact - Contact to toggle assignment
   * @param {boolean} checked - True to assign, false to unassign
   * 
   * @returns {void}
   * 
   * @example
   * // Assign John to task
   * this.toggleContact(johnContact, true);
   * // Assign Sarah to task
   * this.toggleContact(sarahContact, true);
   * // Unassign John
   * this.toggleContact(johnContact, false);
   */
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

  /**
   * Updates the display text of assigned contacts
   * 
   * Creates comma-separated string of assigned contact names.
   * Used to show selection summary in the contact dropdown field.
   * 
   * @returns {void}
   * 
   * @example
   * // After assigning John and Sarah
   * this.updateAssignedToText();
   * // assignedToText becomes "John, Sarah"
   */
  updateAssignedToText() {
    this.assignedToText = this.assignedTo()
      .map((c) => c.name)
      .join(', ');
  }

  /**
   * Toggles visibility of contact assignment menu/dropdown
   * 
   * Switches the menuOpen state to show or hide the contact selection dropdown.
   * 
   * @returns {void}
   */
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  /**
   * Closes the contact assignment menu/dropdown
   * 
   * Sets menuOpen to false to hide the contact selection dropdown.
   * 
   * @returns {void}
   */
  closeMenu() {
    this.menuOpen = false;
  }

  /**
   * Validates and creates a new task with all entered information
   * 
   * Validates that all required fields (title, task type, priority, due date) are filled.
   * If validation fails, shows error message for 2 seconds.
   * If valid:
   * 1. Creates task in Firestore with currentStatus
   * 2. Assigns selected contacts to task
   * 3. Creates all subtasks
   * 4. Shows success message and closes dialog after 1 second
   * 
   * Handles errors by logging to console and showing error message to user.
   * 
   * @async
   * @returns {Promise<void>}
   * 
   * @throws {Error} Logs errors to console if Firestore operations fail
   * 
   * @example
   * // Create task after form completion
   * await this.createTask();
   * // Task created in Firestore with assignments and subtasks
   * // Success message shown, navigates to /board
   */
  async createTask() {
    const prio = this.priority();
    if (!this.title() || !this.selectedTaskType() || !prio || !this.dueDate()) {
      this.taskErrorMessage.set('Please fill all required fields!');
      setTimeout(() => this.taskErrorMessage.set(''), 2000);
      return;
    }

    const newTask: Omit<Task, 'id'> = {
      title: this.title(),
      description: this.description(),
      date: Timestamp.fromDate(this.dueDate()!),
      type: this.selectedTaskType()!,
      status: this.currentStatus(),
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

  /**
   * Resets the entire form to its initial state
   * 
   * Clears all form inputs, signals, arrays, and validation flags:
   * - Title, description, due date reset
   * - Task type, priority reset to defaults
   * - All subtasks cleared
   * - All assignments cleared
   * - All validation error states cleared
   * - Datepicker closed if open
   * 
   * Used when user clicks reset/cancel button or after successful task creation.
   * 
   * @returns {void}
   * 
   * @example
   * // Clear form after canceling or successful submission
   * this.resetForm();
   * // Form returns to empty state
   */
  resetForm() {
    this.title.set('');
    this.description.set('');
    this.dueDate.set(null);
    this.selectedTaskType.set(null);
    this.priority.set('medium');

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
