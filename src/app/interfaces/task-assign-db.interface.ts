/**
 * Task Assignment Database Interface (Storage Format)
 * 
 * Minimal interface for storing task assignment data in Firestore.
 * This is the actual format stored in tasks/{taskId}/assigns/{assignmentId}.
 * 
 * When displayed in UI, this is enriched with contact information to create
 * the TaskAssign interface (which includes name, initials, and color).
 * 
 * Properties:
 * - id: Optional Firestore document ID
 * - contactId: Reference to contact document ID being assigned
 * 
 * Related Interfaces:
 * - TaskAssign: UI-enriched version with display properties
 * 
 * @interface
 * 
 * @example
 * // Stored in Firestore as:
 * const dbAssignment: TaskAssignDb = {
 *   id: 'assign-123',
 *   contactId: 'user-123'
 * };
 * 
 * // Retrieved and enriched to become:
 * const uiAssignment: TaskAssign = {
 *   contactId: 'user-123',
 *   name: 'John Doe',
 *   initials: 'JD',
 *   color: '#FF5733'
 * };
 */
export interface TaskAssignDb {
  id?: string;
  contactId: string;
}
