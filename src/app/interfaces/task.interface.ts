import { TaskType } from '../types/task-type';
import { TaskStatus } from '../types/task-status';
import { Timestamp } from '@angular/fire/firestore';

/**
 * Task Data Interface
 * 
 * Represents a task/todo item in the system. Tasks are stored in Firestore
 * and can be assigned to contacts, have subtasks, and track status/priority.
 * 
 * Properties:
 * - id: Unique Firestore document ID (auto-generated)
 * - type: TaskType enum (UserStory or TechnicalTask)
 * - status: TaskStatus enum (ToDo, InProgress, AwaitFeedback, Done)
 * - date: Firestore Timestamp for task due date
 * - title: Task title/name (displayed in UI)
 * - description: Detailed task description/notes
 * - priority: Numeric priority (1 = highest/urgent)
 * 
 * Related Data:
 * - Assignments: Task assignees stored in tasks/{id}/assigns subcollection
 * - Subtasks: Task checklist items in tasks/{id}/subtasks subcollection
 * 
 * @interface
 * 
 * @example
 * const task: Task = {
 *   id: 'task-123',
 *   type: TaskType.UserStory,
 *   status: TaskStatus.InProgress,
 *   title: 'Implement login page',
 *   description: 'Create responsive login form',
 *   priority: 1,
 *   date: Timestamp.now()
 * };
 */
export interface Task {
  id?: string;
  type: TaskType;
  status: TaskStatus;
  date: Timestamp;
  title: string;
  description: string;
  priority: number;
}