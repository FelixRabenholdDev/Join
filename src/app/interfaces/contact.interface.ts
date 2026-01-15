/**
 * Contact Data Interface
 * 
 * Represents a contact/user in the system. Contacts can be assigned to tasks
 * and have associated information for collaboration and communication.
 * 
 * Properties:
 * - id: Unique Firestore document ID (user UID for registered users)
 * - name: Contact's full name
 * - email: Contact's email address
 * - phone: Contact's phone number
 * - color: Assigned UI color (hex value from palette)
 * - isUser: Optional flag marking this as a registered user account
 * 
 * Types of Contacts:
 * - Regular Contacts: Added by users for collaboration
 * - User Accounts: Created on signup with isUser = true
 * 
 * @interface
 * 
 * @example
 * const contact: Contact = {
 *   id: 'user-123',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '+1-234-567-8900',
 *   color: '#FF5733',
 *   isUser: true
 * };
 */
export interface Contact {
    id: string;
    name:string;
    email:string;
    phone: string;
    color: string;
    isUser?: boolean;
}