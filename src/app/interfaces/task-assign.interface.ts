/**
 * Task Assignment Interface (UI/Display)
 * 
 * Represents a contact assigned to a task, enriched with display information.
 * Used for rendering assignee avatars and information in the UI.
 * Combines Firestore data with computed display properties.
 * 
 * Properties:
 * - contactId: Firestore document ID of the assigned contact
 * - name: Contact's full name (from contact record)
 * - initials: Extracted initials for avatar display (e.g., 'JD')
 * - color: Assigned UI color for consistent visual representation
 * 
 * Related Data:
 * - Stored in: tasks/{taskId}/assigns/{assignmentId}
 * - Raw storage format: TaskAssignDb (only contactId)
 * 
 * @interface
 * 
 * @example
 * const assignment: TaskAssign = {
 *   contactId: 'user-123',
 *   name: 'John Doe',
 *   initials: 'JD',
 *   color: '#FF5733'
 * };
 */
export interface TaskAssign {
  contactId: string;
  name: string;
  initials: string;
  color: string;
}
