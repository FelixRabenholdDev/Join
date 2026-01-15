/**
 * Task Status Enumeration
 * 
 * Represents the possible status values for tasks in the system.
 * Tasks progress through these states in the task lifecycle.
 * 
 * States:
 * - ToDo: Task created but not started
 * - InProgress: Task is currently being worked on
 * - AwaitFeedback: Task completed and waiting for feedback/review
 * - Done: Task completed successfully
 * 
 * @enum {string}
 * 
 * @example
 * task.status = TaskStatus.ToDo;
 * if (task.status === TaskStatus.Done) { }
 */
export enum TaskStatus {
  ToDo = 'todo',
  InProgress = 'in_progress',
  AwaitFeedback = 'await_feedback',
  Done = 'done',
}