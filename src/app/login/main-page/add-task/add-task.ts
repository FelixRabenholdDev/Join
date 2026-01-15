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

/**
 * Add Task Component - Task Creation Form
 * 
 * Comprehensive form for creating new tasks with all properties. Allows setting
 * title, description, priority, type, status, due date, assignments, and subtasks.
 * Validates form before submission and provides real-time feedback to user.
 * 
 * Features:
 * - Task title and description input
 * - Priority selection (1-5)
 * - Task type selection (UserStory, TechnicalTask)
 * - Status selection (ToDo, InProgress, AwaitFeedback, Done)
 * - Due date picker with Material Datepicker
 * - Contact assignment with multi-select dropdown
 * - Subtask list management (add/remove)
 * - Form validation with error messages
 * - Save and cancel operations
 * 
 * Form Validation:
 * - Title: Required, non-empty
 * - Description: Optional
 * - Priority: Required
 * - Type: Required
 * - Status: Required
 * - Due Date: Optional
 * 
 * @component
 * @selector app-add-task
 * @standalone true
 */
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

  /**
   * Task title/name signal
   * 
   * @type {Signal<string>}
   */
  private firebase = inject(FirebaseServices);

  title = signal('');

  /**
   * Task description/details signal
   * 
   * @type {Signal<string>}
   */
  description = signal('');

  /**
   * Task due date signal
   * Initialized to null, can be set via datepicker
   * 
   * @type {Signal<Date | null>}
   */
  dueDate = signal<Date | null>(null);

  /**
   * Minimum date that can be selected in datepicker
   * Set to today's date on component initialization
   * 
   * @type {Signal<Date>}
   */
  minDate = signal<Date>(new Date());

  /**
   * Selected task type (UserStory or TechnicalTask)
   * 
   * @type {Signal<TaskType | null>}
   */
  selectedTaskType = signal<TaskType | null>(null);

  /**
   * Task priority level ('urgent', 'medium', or 'low')
   * Maps to numeric values: 1=urgent, 2=medium, 3=low
   * 
   * @type {Signal<'urgent' | 'medium' | 'low' | null>}
   */
  priority = signal<'urgent' | 'medium' | 'low' | null>('medium');

  /**
   * Reactive signal of all available contacts for assignment
   * Synced from Firestore via Firebase service
   * 
   * @type {Signal<Contact[]>}
   */
  contacts = toSignal(this.firebase.subContactsList(), { initialValue: [] as Contact[] });

  /**
   * Reactive signal of selected contacts to assign to this task
   * 
   * @type {Signal<Contact[]>}
   */
  assignedTo = signal<Contact[]>([]);

  /**
   * Current input value for new subtask being added
   * 
   * @type {string}
   */
  subtaskInput = '';

  /**
   * Array of subtasks for this task
   * Each subtask has title and done status
   * 
   * @type {Subtask[]}
   */
  subtasks: Subtask[] = [];

  /**
   * Controls visibility of subtask action icons (edit/delete)
   * 
   * @type {boolean}
   */
  showIcons = false;

  /**
   * Index of subtask currently being edited, null if none
   * 
   * @type {number | null}
   */
  editIndex: number | null = null;

  /**
   * Query list of edit input elements for subtask editing
   * 
   * @type {QueryList<ElementRef<HTMLInputElement>>}
   */
  @ViewChildren('editInput') editInputs!: QueryList<ElementRef<HTMLInputElement>>;

  /**
   * Reference to Material datepicker component
   * Used to open/close the date picker programmatically
   * 
   * @type {MatDatepicker<any>}
   */
  @ViewChild('picker') picker!: MatDatepicker<any>;

  /**
   * Controls visibility of contact assignment menu/dropdown
   * 
   * @type {boolean}
   */
  menuOpen = false;

  /**
   * Tracks if due date field has been interacted with by user
   * 
   * @type {boolean}
   */
  dueDateTouched = false;

  /**
   * Tracks if datepicker is currently open
   * 
   * @type {boolean}
   */
  isDatepickerOpen = false;

  /**
   * Tracks if form has been touched by user
   * 
   * @type {boolean}
   */
  isTouched = false;

  /**
   * Tracks if task type field has been touched
   * 
   * @type {boolean}
   */
  taskTypeTouched = false;

  /**
   * Tracks if task type field has focus
   * 
   * @type {boolean}
   */
  taskTypeFocused = false;

  /**
   * Shows error state for task type field
   * 
   * @type {boolean}
   */
  taskTypeError = false;

  /**
   * Comma-separated display of assigned contact names
   * Updated when contacts are selected/deselected
   * 
   * @type {string}
   */
  assignedToText: string = '';

  /**
   * Tracks if select dropdown is currently open
   * 
   * @type {boolean}
   */
  selectOpened = false;

  /**
   * Success message to display after task creation
   * Clears after 1 second
   * 
   * @type {Signal<string>}
   */
  taskAddedMessage = signal('');

  /**
   * Error message to display if task creation fails
   * Clears after 1 second
   * 
   * @type {Signal<string>}
   */
  taskErrorMessage = signal('');

  /**
   * Array of available task types from TaskType enum
   * Maps enum keys to their numeric values
   * 
   * @type {{name: string, value: TaskType}[]}
   */
  taskTypes = Object.entries(TaskType)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({ name: key, value: value as TaskType }));

  constructor(
    public userUi: UserUiService,
    private router: Router,

  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // nur Datum ohne Zeit
    this.minDate.set(today);
  }



  /**
   * Adds a new subtask to the task's subtask list
   * 
   * Validates that the input is not empty (after trimming whitespace).
   * If valid, creates a new Subtask object with title and done=false,
   * adds it to the subtasks array, and clears the input field.
   * Does nothing if input is empty.
   * 
   * @returns {void}
   * 
   * @example
   * // Add a subtask from user input
   * this.subtaskInput = 'Implement login form';
   * this.addSubtask();
   * // Subtask added to array, input cleared
   */
  addSubtask() {
    const title = this.subtaskInput.trim();
    if (!title) return;
    this.subtasks.push({ title, done: false });
    this.subtaskInput = '';
  }

  /**
   * Clears the subtask input field
   * 
   * Used when user cancels adding a subtask or wants to clear the input
   * without adding it to the list.
   * 
   * @returns {void}
   * 
   * @example
   * // Clear input when user clicks cancel
   * this.clearInput();
   * // subtaskInput becomes empty string
   */
  clearInput() {
    this.subtaskInput = '';
  }

  /**
   * Opens subtask in edit mode by setting edit index and focusing input
   * 
   * Sets editIndex to the provided index and asynchronously focuses and
   * selects the corresponding edit input element. Uses queueMicrotask
   * to ensure DOM is updated before focusing.
   * 
   * @param {number} index - Index of subtask to edit in subtasks array
   * 
   * @returns {void}
   * 
   * @example
   * // Edit subtask at index 2
   * this.editSubtask(2);
   * // Edit mode activated, input focused and text selected
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
   * Sets editIndex to null to close the edit mode and finalize changes
   * to the subtask being edited. Changes are saved to the subtasks array.
   * 
   * @returns {void}
   * 
   * @example
   * // Finish editing subtask
   * this.saveEdit();
   * // editIndex becomes null, edit mode closed
   */
  saveEdit() {
    this.editIndex = null;
  }

  /**
   * Removes a subtask from the list by index
   * 
   * Deletes the subtask at the specified index from the subtasks array.
   * Used when user clicks delete button on a subtask.
   * 
   * @param {number} index - Index of subtask to delete
   * 
   * @returns {void}
   * 
   * @example
   * // Delete subtask at index 1
   * this.deleteSubtask(1);
   * // Subtask removed from array
   */
  deleteSubtask(index: number) {
    this.subtasks.splice(index, 1);
  }

  /**
   * TrackBy function for subtask list *ngFor loop
   * 
   * Used by Angular to identify and reuse subtask DOM elements efficiently.
   * Using index as track key for this simple list.
   * 
   * @param {number} index - Index of the subtask
   * 
   * @returns {number} Index for DOM element tracking
   */
  trackByIndex(index: number) {
    return index;
  }

  /**
   * Handles blur event on subtask input field
   * 
   * Hides the action icons (edit/delete) when user leaves the input field
   * and the input is empty (after trimming).
   * 
   * @returns {void}
   * 
   * @example
   * // Hide icons when input loses focus
   * this.onBlur();
   * // showIcons becomes false if input is empty
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
   * If validation fails, shows error message for 1 second.
   * If valid:
   * 1. Creates task in Firestore
   * 2. Assigns selected contacts to task
   * 3. Creates all subtasks
   * 4. Shows success message and navigates to board after 1 second
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
   * // Success message shown, routes to /board
   */
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
