import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../firebase-services/auth-services';

/**
 * Login Component - User Authentication and Registration
 * 
 * Handles user authentication workflows including login, registration (sign-up), and guest login.
 * Provides form validation with real-time error feedback and seamless navigation to the main
 * application upon successful authentication.
 * 
 * Features:
 * - Email/password authentication
 * - User registration with comprehensive validation
 * - Guest login for quick access
 * - Real-time form validation with error states
 * - Password strength checking (minimum 6 characters)
 * - Dual-mode UI (login vs sign-up forms)
 * - Email format validation
 * - Terms/policy acceptance requirement
 * 
 * @component
 * @selector app-login
 * @standalone true
 * @imports [CommonModule, FormsModule, RouterModule]
 * 
 * @example
 * // Usage in routing
 * { path: 'Login', component: Login }
 * 
 * // After successful login, user is navigated to /summary
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss', 'login-media.scss']
})
export class Login {
  /**
   * User's full name entered during sign-up
   * Required field for account creation
   * 
   * @type {string}
   */
  name = '';

  /**
   * User's email address
   * Used for authentication and account recovery
   * Validated against standard email pattern
   * 
   * @type {string}
   */
  email = '';

  /**
   * User's password
   * Minimum 6 characters required
   * Compared with confirmPassword for validation
   * 
   * @type {string}
   */
  password = '';

  /**
   * Password confirmation during sign-up
   * Must match password field exactly
   * 
   * @type {string}
   */
  confirmPassword = '';

  /**
   * Toggle flag for sign-up mode
   * When true, displays sign-up form; when false, displays login form
   * 
   * @type {boolean}
   */
  isSignUp = false;

  /**
   * Flag indicating login failure
   * Set to true when email/password combination is invalid
   * 
   * @type {boolean}
   */
  loginError = false;

  /**
   * Validation error flag - name field is required
   * Set to true if name is empty or contains only whitespace
   * 
   * @type {boolean}
   */
  nameError = false;

  /**
   * Validation error flag - email field is required
   * Set to true if email is empty or contains only whitespace
   * 
   * @type {boolean}
   */
  emailError = false;

  /**
   * Validation error flag - password mismatch
   * Set to true if password and confirmPassword do not match
   * 
   * @type {boolean}
   */
  passwordMatchError = false;

  /**
   * Validation error flag - password field is required
   * Set to true if password is empty
   * 
   * @type {boolean}
   */
  passwordError = false;

  /**
   * Validation error flag - password too short
   * Set to true if password length is less than 6 characters
   * 
   * @type {boolean}
   */
  passwordTooShortError = false;

  /**
   * Validation error flag - invalid email format
   * Set to true if email does not match standard email pattern
   * Pattern: something@something.extension
   * 
   * @type {boolean}
   */
  invalidEmailError = false;

  /**
   * Flag indicating user acceptance of terms and policies
   * Required field for sign-up completion
   * 
   * @type {boolean}
   */
  agreed = false;

  /**
   * Flag indicating email is already registered
   * Set to true if Firebase returns 'auth/email-already-in-use' error
   * 
   * @type {boolean}
   */
  emailTakenError = false;

  /**
   * Creates an instance of the Login component
   * 
   * @param {AuthService} auth - Service for handling Firebase authentication operations
   * @param {Router} router - Angular router for navigation after authentication
   * @param {ChangeDetectorRef} cd - Change detector for manual change detection when needed
   */
  constructor(
    private auth: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}


  async login(): Promise<void> {
    this.loginError = false;
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/summary']);
    } catch (error: any) {
      this.loginError = true;
      this.cd.detectChanges();
    }
  }

  /**
   * Registers a new user with comprehensive validation
   * 
   * Performs validation for:
   * - Name presence and non-empty
   * - Email presence and format validity
   * - Password presence, minimum length (6 chars), and match confirmation
   * - Terms acceptance
   * 
   * On success:
   * - Creates user account in Firebase Authentication
   * - Creates user contact record in Firestore
   * - Assigns user color for UI display
   * - Navigates to summary page
   * 
   * On failure:
   * - Sets appropriate validation error flags
   * - Displays error messages to user
   * - Handles email-already-in-use error specifically
   * 
   * @async
   * @returns {Promise<void>} Resolves when sign-up process completes
   * @throws {Error} Firebase errors are caught and handled locally
   * 
   * @example
   * await this.signup();
   * // New user account created and user navigated to /summary
   */
  async signup(): Promise<void> {
    this.nameError = !this.name?.trim();
    this.emailError = !this.email?.trim();
    this.invalidEmailError = false;
    this.passwordError = !this.password;
    this.passwordTooShortError = false;
    this.passwordMatchError = false;
    this.emailTakenError = false;

    if (!this.emailError) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(this.email)) {
        this.invalidEmailError = true;
      }
    }

    if (!this.passwordError && this.password.length < 6) {
      this.passwordTooShortError = true;
    }

    if (
      !this.passwordError &&
      !this.passwordTooShortError &&
      this.password !== this.confirmPassword
    ) {
      this.passwordMatchError = true;
    }

    if (
      this.nameError ||
      this.emailError ||
      this.invalidEmailError ||
      this.passwordError ||
      this.passwordTooShortError ||
      this.passwordMatchError
    ) {
      return;
    }

    try {
      await this.auth.signup(this.name, this.email, this.password);
      this.router.navigate(['/summary']);
    } catch (error: any) {
      if (
        error.code === 'auth/email-already-in-use' ||
        error.message?.includes('already in use')
      ) {
        this.emailTakenError = true;
        this.cd.detectChanges();
      } else {
        console.error(error);
      }
    }
  }

  /**
   * Logs in a guest user without credentials
   * 
   * Creates an anonymous Firebase authentication session. Guest users have limited
   * access but can still interact with the application. On success, navigates to
   * the summary page.
   * 
   * @async
   * @returns {Promise<void>} Resolves when guest login completes
   * @throws {Error} Firebase anonymous authentication errors are caught and handled
   * 
   * @example
   * await this.guestLogin();
   * // User logged in as guest, navigated to /summary
   */
  async guestLogin(): Promise<void> {
    try {
      await this.auth.loginGuest();
      this.router.navigate(['/summary']);
    } catch (error: any) {}
  }

  /**
   * Toggles between login and sign-up mode
   * 
   * Switches the UI display between login form and sign-up form. When toggling,
   * resets relevant error states to provide clean user experience when switching modes.
   * 
   * @returns {void}
   * 
   * @example
   * this.openSignUp();
   * // If was in login mode, now displays sign-up form
   * // If was in sign-up mode, now displays login form
   */
  openSignUp(): void {
    this.isSignUp = !this.isSignUp;
    this.loginError = false;
    this.passwordMatchError = false;
  }
}
