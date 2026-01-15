/**
 * Task Type Enumeration
 * 
 * Categorizes tasks into different types for organization and display.
 * Allows filtering and grouping of tasks by their nature/classification.
 * 
 * Types:
 * - UserStory (1): Feature request or user-facing requirement
 * - TechnicalTask (2): Technical work, bug fix, or infrastructure task
 * 
 * @enum {number}
 * 
 * @example
 * task.type = TaskType.UserStory;
 * if (task.type === TaskType.TechnicalTask) { }
 */
export enum TaskType {
  UserStory = 1,
  TechnicalTask = 2,
}