/**
 * Subtask Data Interface
 * 
 * Represents a checklist item within a task. Subtasks allow breaking down
 * larger tasks into smaller, trackable steps. Stored as a subcollection
 * under tasks/{taskId}/subtasks in Firestore.
 * 
 * Properties:
 * - id: Unique Firestore document ID (auto-generated)
 * - title: Subtask description/name
 * - done: Completion status (true = completed, false = pending)
 * 
 * @interface
 * 
 * @example
 * const subtask: Subtask = {
 *   id: 'sub-1',
 *   title: 'Design database schema',
 *   done: true
 * };
 * 
 * const pendingSubtask: Subtask = {
 *   title: 'Implement API endpoints',
 *   done: false
 * };
 */
export interface Subtask {
  id?: string;
  title: string;
  done: boolean;
}