import { Component, ViewChild, signal, inject, ElementRef } from '@angular/core';
import { Dialog } from '../../../../../shared/dialog/dialog';
import { BoardTask } from '../../../../../interfaces/task-board.interface';
import { TaskType } from '../../../../../types/task-type';
import { CommonModule } from '@angular/common';
import { FirebaseServices } from '../../../../../firebase-services/firebase-services';
import { Contact } from '../../../../../interfaces/contact.interface';
import { Timestamp } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserUiService } from '../../../../../services/user-ui.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dialog-show-edit-task',
  standalone: true,
  imports: [CommonModule, Dialog, FormsModule, MatSelectModule, MatFormFieldModule, RouterModule],
  templateUrl: './dialog-show-edit-task.html',
  styleUrls: ['./dialog-show-task.scss', './dialog-edit-task.scss'],
})
export class DialogShowEditTask {
  /**
   * Reference to the dialog modal component
   * Controlled to open/close via this reference
   * 
   * @type {Dialog}
   */
  @ViewChild('DialogShowEditTask') dialog!: Dialog;

  /**
   * Reference to subtask input element
   * Used to focus when adding new subtask
   * 
   * @type {ElementRef<HTMLInputElement>}
   */
  @ViewChild('subtaskInput') subtaskInput!: ElementRef<HTMLInputElement>;

  private readonly firebase = inject(FirebaseServices);
  private readonly userUi = inject(UserUiService);

  /**
   * Currently displayed/edited task
   * Set when dialog is opened
   * 
   * @type {Signal<BoardTask | null>}
   */
  readonly task = signal<BoardTask | null>(null);

  /**
   * All available contacts for assignment
   * Loaded from Firestore on component creation
   * 
   * @type {Signal<Contact[]>}
   */
  readonly contacts = signal<Contact[]>([]);

  /**
   * Reference to TaskType enum for template usage
   * 
   * @type {typeof TaskType}
   */
  readonly TaskType = TaskType;

  /**
   * Tracks if dialog is in edit mode or view mode
   * 
   * @type {boolean}
   */
  isEditMode: boolean = false;

  /**
   * Model for editing task when in edit mode
   * Contains mutable copies of task data before saving
   * 
   * @type {object}
   */
  editData: any = {
    title: '',
    description: '',
    date: '',
    priority: 2,
    assigns: [],
    subtasks: [],
  };

  /**
   * New subtask title being added
   * Cleared after adding
   * 
   * @type {string}
   */
  newSubtaskTitle: string = '';

  /**
   * Index of subtask currently being edited, null if none
   * 
   * @type {number | null}
   */
  editingIndex: number | null = null;

  /**
   * Original subtask title before edit started
   * Used for canceling edit without saving
   * 
   * @type {string}
   */
  originalTitle = '';

  /**
   * Component constructor
   * 
   * Subscribes to Firebase contacts list and updates local contacts signal.
   * Automatically unsubscribes when component is destroyed.
   */
  constructor() {
    this.firebase
      .subContactsList()
      .pipe(takeUntilDestroyed())
      .subscribe((contacts) => {
        this.contacts.set(contacts);
      });
  }

  /**
   * Opens the dialog with a task for viewing
   * 
   * Sets the task signal and opens the modal dialog in view mode.
   * 
   * @param {BoardTask} task - The task to display
   * 
   * @returns {void}
   */
  open(task: BoardTask): void {
    this.task.set(task);
    this.isEditMode = false;
    this.dialog.open();
  }

  /**
   * Closes the dialog modal
   * 
   * @returns {void}
   */
  close(): void {
    this.dialog.close();
  }

  /**
   * Gets the appropriate SVG icon path for the task type
   * 
   * Returns the image path for UserStory or TechnicalTask icon.
   * Empty string if no task is loaded.
   * 
   * @returns {string} SVG image path or empty string
   */
  get taskTypeSvg(): string {
    if (!this.task()) return '';
    switch (this.task()!.type) {
      case TaskType.UserStory:
        return 'img/task_type_user_story.svg';
      case TaskType.TechnicalTask:
        return 'img/task_type_technical_task.svg';
      default:
        return '';
    }
  }

  /**
   * Toggles between view and edit mode
   * 
   * When switching to edit mode, populates editData with current task values.
   * Converts Firestore timestamp to ISO date string for date input.
   * Creates mutable copies of assigns and subtasks arrays.
   * 
   * @returns {void}
   */
  switchPage(): void {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode && this.task()) {
      const t = this.task()!;
      this.editData = {
        ...t,
        date: new Date(t.date.seconds * 1000).toISOString().split('T')[0],
        assigns: t.assigns ? t.assigns.map((a) => ({ ...a })) : [],
        subtasks: t.subtasks ? t.subtasks.map((s) => ({ ...s })) : [],
      };
    }
  }

  /**
   * Sets the task priority in edit mode
   * 
   * Updates editData priority to the specified numeric value.
   * Used when user clicks priority button (1, 2, or 3).
   * 
   * @param {number} prio - Priority number (1=urgent, 2=medium, 3=low)
   * 
   * @returns {void}
   */
  setPrio(prio: number) {
    this.editData.priority = prio;
  }

  /**
   * Focuses the subtask input element
   * 
   * Called when user clicks "Add Subtask" to focus cursor in input field.
   * 
   * @returns {void}
   */
  focusInput(): void {
    this.subtaskInput?.nativeElement.focus();
  }

  /**
   * Adds a new subtask to the edit model
   * 
   * Validates input is not empty, creates subtask object with title and done=false,
   * adds to editData.subtasks, and clears the input field.
   * 
   * @returns {void}
   */
  addSubtask() {
    if (this.newSubtaskTitle.trim()) {
      this.editData.subtasks.push({
        title: this.newSubtaskTitle,
        done: false,
      });
      this.newSubtaskTitle = '';
    }
  }

  /**
   * Cancels adding a new subtask
   * 
   * Clears input and removes focus from input element.
   * 
   * @returns {void}
   */
  cancelAddSubtask() {
    this.newSubtaskTitle = '';
    (document.activeElement as HTMLElement)?.blur();
  }

  /**
   * Removes a subtask from the edit model
   * 
   * Deletes the subtask at specified index from editData.subtasks.
   * 
   * @param {number} index - Index of subtask to remove
   * 
   * @returns {void}
   */
  removeSubtask(index: number) {
    this.editData.subtasks.splice(index, 1);
  }

  /**
   * Gets initials from a contact name
   * 
   * Delegates to UserUiService to extract initials from name string.
   * 
   * @param {string} name - Contact name
   * 
   * @returns {string} Initials (e.g., "JD" for "John Doe")
   */
  getInitials(name: string): string {
    return this.userUi.getInitials(name);
  }

  /**
   * Toggles a subtask's done status and saves to Firestore
   * 
   * Flips the done boolean flag for the subtask at specified index
   * and immediately persists to Firestore via editSubtask method.
   * Does nothing if task or subtask IDs are missing.
   * 
   * @async
   * @param {number} index - Index of subtask in task.subtasks array
   * @param {BoardTask} task - The parent task
   * 
   * @returns {Promise<void>}
   * 
   * @throws {Error} Will throw if Firestore update fails
   */
  async toggleSubtask(index: number, task: BoardTask) {
    if (!task.subtasks || !task.subtasks[index]) return;
    const subtask = task.subtasks[index];
    subtask.done = !subtask.done;
    if (task.id && subtask.id) {
      await this.firebase.editSubtask(task.id, subtask.id, { done: subtask.done });
    }
  }

  /**
   * Deletes the entire task and all associated data from Firestore
   * 
   * Removes the task document and all nested collections (subtasks, assignments).
   * Closes the dialog after successful deletion.
   * Does nothing if task ID is missing.
   * 
   * @async
   * @returns {Promise<void>}
   * 
   * @throws {Error} Will throw if Firestore deletion fails
   */
  async deleteTask(): Promise<void> {
    const taskId = this.task()?.id;
    if (!taskId) return;
    await this.firebase.deleteTaskWithChildren(taskId);
    this.close();
  }

  /**
   * Saves all edited task data to Firestore
   * 
   * Complex operation that:
   * 1. Updates task basic properties (title, description, priority, date)
   * 2. Syncs task assignments - removes unassigned contacts, adds new ones
   * 3. Syncs subtasks - removes deleted subtasks, adds new ones
   * 4. Preserves unchanged data
   * 5. Closes dialog on success, logs errors on failure
   * 
   * Uses firstValueFrom to await observable results for DB comparisons.
   * 
   * @async
   * @returns {Promise<void>}
   * 
   * @throws {Error} Caught and logged; does not re-throw
   * 
   * @example
   * // After editing task, user clicks save
   * await this.saveTask();
   * // Task updated in Firestore with all changes, dialog closed
   */
  async saveTask() {
    const currentTask = this.task();
    if (!currentTask?.id) return;

    try {
      const taskId = currentTask.id;

      const updatedTask = {
        title: this.editData.title,
        description: this.editData.description,
        priority: this.editData.priority,
        date: Timestamp.fromDate(new Date(this.editData.date)),
      };
      await this.firebase.editTask({ id: taskId, ...updatedTask } as any);

      const currentDbAssigns = await firstValueFrom(this.firebase.subTaskAssigns(taskId));

      for (const dbA of currentDbAssigns) {
        const stillExists = this.editData.assigns.some((fa: any) => fa.contactId === dbA.contactId);
        if (!stillExists && dbA.id) {
          await this.firebase.deleteTaskAssign(taskId, dbA.id);
        }
      }

      for (const fa of this.editData.assigns) {
        const alreadyInDb = currentDbAssigns.some((dbA) => dbA.contactId === fa.contactId);
        if (!alreadyInDb) {
          await this.firebase.addTaskAssign(taskId, {
            contactId: fa.contactId,
            name: fa.name,
            color: fa.color,
            initials: fa.initials,
          });
        }
      }

      const currentDbSubtasks = await firstValueFrom(this.firebase.subSubtasks(taskId));

      for (const dbS of currentDbSubtasks) {
        if (!this.editData.subtasks.some((fs: any) => fs.title === dbS.title)) {
          if (dbS.id) await this.firebase.deleteSubtask(taskId, dbS.id);
        }
      }

      for (const fs of this.editData.subtasks) {
        if (!currentDbSubtasks.some((dbS) => dbS.title === fs.title)) {
          await this.firebase.addSubtask(taskId, { title: fs.title, done: fs.done || false });
        }
      }

      this.close();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  }

  /**
   * Tracks if contact selection dropdown is open
   * 
   * @type {boolean}
   */
  selectOpened: boolean = false;

  /**
   * Gets the contacts currently assigned to the task
   * 
   * Filters the full contacts list to return only those assigned to the task
   * in the edit model. Used for pre-selecting in dropdown.
   * 
   * @returns {Contact[]} Contacts assigned to this task
   */
  getSelectedContacts(): Contact[] {
    return this.contacts().filter((c) =>
      this.editData.assigns.some((a: any) => a.contactId === c.id),
    );
  }

  /**
   * Handles contact selection change from Material select dropdown
   * 
   * Maps selected Contact objects to task assignment objects with
   * contactId, name, color, and initials. Replaces current assigns array.
   * 
   * @param {any} event - Material select change event with value property
   * 
   * @returns {void}
   */
  onSelectionChange(event: any) {
    const selectedContacts: Contact[] = event.value;
    this.editData.assigns = selectedContacts.map((c) => ({
      contactId: c.id,
      name: c.name,
      color: c.color,
      initials: this.getInitials(c.name),
    }));
  }

  /**
   * Enters edit mode for a subtask by index
   * 
   * Sets editingIndex to the provided index and saves original title for canceling.
   * 
   * @param {number} index - Index of subtask to edit
   * 
   * @returns {void}
   */
  setEditing(index: number) {
    this.editingIndex = index;
    this.originalTitle = this.editData.subtasks[index].title;
  }

  /**
   * Confirms and saves subtask edit
   * 
   * Exits edit mode by clearing editingIndex and originalTitle.
   * Changes to subtask title are already reflected in editData.
   * 
   * @returns {void}
   */
  confirmEdit() {
    this.editingIndex = null;
    this.originalTitle = '';
  }

  /**
   * Cancels subtask edit without saving changes
   * 
   * Restores the subtask title to originalTitle and exits edit mode.
   * Does nothing if no subtask is being edited.
   * 
   * @returns {void}
   */
  cancelEdit() {
    if (this.editingIndex === null) return;

    this.editData.subtasks[this.editingIndex].title = this.originalTitle;
    this.editingIndex = null;
    this.originalTitle = '';
  }

  /**
   * Clears the editing index without restoring changes
   * 
   * Exits edit mode without reverting to original title.
   * Used for cleanup when navigating away from edit.
   * 
   * @returns {void}
   */
  clearEditing() {
    this.editingIndex = null;
  }
}
