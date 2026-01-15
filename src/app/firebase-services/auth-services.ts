import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  deleteUser,
  user,
} from '@angular/fire/auth';
import { FirebaseServices } from '../firebase-services/firebase-services';
import { UserUiService } from '../services/user-ui.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

/**
 * Authentication Service
 * 
 * Manages user authentication workflows including login, registration, guest access,
 * and logout. Integrates with Firebase Authentication and maintains user session state.
 * 
 * Authentication Methods:
 * - Email/Password authentication (login)
 * - Email/Password registration (signup)
 * - Anonymous guest login
 * - Logout with proper session cleanup
 * 
 * Key Features:
 * - Firebase Authentication integration
 * - User contact creation on signup
 * - User color assignment for UI consistency
 * - Session state tracking via BehaviorSubject
 * - Anonymous user cleanup on logout
 * - Router integration for post-auth navigation
 * 
 * State Management:
 * - currentUser$: Observable stream of current authenticated user
 * - justLoggedIn$: Observable flag indicating recent authentication
 * 
 * @injectable
 * @providedIn 'root'
 * 
 * @example
 * constructor(private auth: AuthService) {}
 * 
 * this.auth.login(email, password).then(credential => {
 *   console.log('User logged in:', credential.user.email);
 * });
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firebase = inject(FirebaseServices);
  private userUi = inject(UserUiService);
  private readonly router = inject(Router);

  /**
   * Current authenticated user Observable stream
   * Emits the current user when authenticated, null when not authenticated
   * Part of @angular/fire/auth API for reactive user state
   * 
   * @type {Observable<User | null>}
   * 
   * @example
   * this.auth.currentUser$.subscribe(user => {
   *   if (user) console.log('User authenticated:', user.email);
   *   else console.log('No user authenticated');
   * });
   */
  currentUser$ = user(this.auth);

  /**
   * Subject tracking recent authentication state
   * Set to true after login/signup/guest login, false after logout
   * Used to trigger post-authentication actions and UI updates
   * 
   * @private
   * @type {BehaviorSubject<boolean>}
   */
  private justLoggedInSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable stream of authentication state changes
   * Emits true after successful login/signup/guest login
   * Emits false after logout
   * 
   * @type {Observable<boolean>}
   * 
   * @example
   * this.auth.justLoggedIn$.subscribe(loggedIn => {
   *   if (loggedIn) this.router.navigate(['/summary']);
   * });
   */
  justLoggedIn$ = this.justLoggedInSubject.asObservable();

  /**
   * Authenticates user with email and password
   * 
   * Validates credentials against Firebase Authentication. On success, updates
   * authentication state and returns user credentials. Throws if credentials are invalid.
   * 
   * @async
   * @param {string} email - User email address
   * @param {string} password - User password (minimum 6 characters)
   * @returns {Promise<UserCredential>} Firebase user credential with authenticated user object
   * @throws {FirebaseError} If email/password combination is invalid or account doesn't exist
   * 
   * @example
   * try {
   *   const cred = await this.auth.login('user@example.com', 'password123');
   *   console.log('Logged in as:', cred.user.email);
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   */
  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    this.justLoggedInSubject.next(true);
    return cred;
  }

  /**
   * Registers a new user with Firebase Authentication
   * 
   * Creates Firebase Authentication account and corresponding user contact record in
   * Firestore. Initializes user UI settings (color assignment) and marks user contact
   * with isUser flag for distinction from regular contacts.
   * 
   * @async
   * @param {string} name - User's full name
   * @param {string} email - User's email address (must be unique)
   * @param {string} password - User's password (minimum 6 characters)
   * @returns {Promise<User>} Firebase user object for newly created account
   * @throws {FirebaseError} If email already exists or validation fails
   * 
   * @example
   * try {
   *   const user = await this.auth.signup('John Doe', 'john@example.com', 'password123');
   *   console.log('Account created for:', user.email);
   * } catch (error) {
   *   console.error('Signup failed:', error.message);
   * }
   */
  async signup(name: string, email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);

    await this.userUi.init();
    const colorIndex = await this.userUi.getNextColorIndex();
    const color = this.userUi.getColorByIndex(colorIndex);

    await this.firebase.createUserContact(cred.user.uid, {
      name,
      email,
      phone: '',
      color,
      isUser: true,
    });

    this.justLoggedInSubject.next(true);
    return cred.user;
  }

  /**
   * Logs in a guest user without credentials
   * 
   * Creates an anonymous Firebase Authentication session. Guest users can interact
   * with the application but have limited functionality. Anonymous account is deleted
   * on logout.
   * 
   * @async
   * @returns {Promise<UserCredential>} Firebase user credential for anonymous user
   * @throws {FirebaseError} If anonymous authentication fails
   * 
   * @example
   * const cred = await this.auth.loginGuest();
   * console.log('Logged in as guest:', cred.user.isAnonymous);
   */
  async loginGuest() {
    const cred = await signInAnonymously(this.auth);
    this.justLoggedInSubject.next(true);
    return cred;
  }

  /**
   * Logs out the current user
   * 
   * Handles both regular user logout and anonymous user deletion. For anonymous users,
   * deletes the entire user account from Firebase. Resets authentication state and
   * navigates to login page regardless of logout success/failure.
   * 
   * @async
   * @returns {Promise<void>} Resolves when logout/cleanup completes
   * 
   * @example
   * await this.auth.logout();
   * // User is logged out and navigated to /Login
   */
  async logout() {
    const user = this.auth.currentUser;

    try {
      if (user && user.isAnonymous) {
        await deleteUser(user);
      } else {
        await signOut(this.auth);
      }
    } catch (error: any) {
      console.warn('Logout/Delete:', error.message);
    } finally {
      this.justLoggedInSubject.next(false);
      this.router.navigate(['/Login']);
    }
  }
}
