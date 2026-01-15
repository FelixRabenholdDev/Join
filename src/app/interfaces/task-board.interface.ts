import { Task } from './task.interface';
import { TaskAssign } from './task-assign.interface';
import { Subtask } from './subtask.interface';

/**
 * Extended Task Interface for Board Display
 * 
 * Enhanced version of Task interface with computed properties for rendering
 * in the kanban board view. Includes assignment and subtask information
 * merged from subcollections.
 * 
 * Base Properties (inherited from Task):
 * - id, type, status, date, title, description, priority
 * 
 * Additional Properties:
 * - assigns: Array of TaskAssign objects (people assigned to task)
 * - subtasksTotal: Count of all subtasks for this task
 * - subtasksDone: Count of completed subtasks
 * - progress: Calculated percentage of completion (0-100)
 * - subtasks: Optional full array of subtask details
 * 
 * Used For:
 * - Kanban board rendering in Board component
 * - Task preview cards showing progress
 * - Progress bars and subtask indicators
 * - Task filtering and search
 * 
 * @interface
 * @extends {Task}
 * 
 * @example
 * const boardTask: BoardTask = {
 *   // Task properties
 *   id: 'task-1',
 *   type: TaskType.UserStory,
 *   status: TaskStatus.InProgress,
 *   title: 'Design UI',
 *   // Extended properties
 *   assigns: [{contactId: 'user-1', name: 'John', initials: 'J', color: '#FF5733'}],
 *   subtasksTotal: 4,
 *   subtasksDone: 2,
 *   progress: 50,
 *   subtasks: [{id: '1', title: 'Wireframes', done: true}]
 * };
 */
export interface BoardTask extends Task {
  assigns: TaskAssign[];
  subtasksTotal: number;
  subtasksDone: number;
  progress: number;
  subtasks?: Subtask[];
}
